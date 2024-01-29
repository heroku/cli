'use strict'
/* globals commands beforeEach */

const cli = require('heroku-cli-util')
const cmd = commands.find(c => c.topic === 'ps' && c.command === 'type')
const nock = require('nock')
const expect = require('chai').expect

// will remove this flag once we have
// successfully launched larger dyno sizes
function featureFlagPayload(isEnabled = false) {
  return {
    enabled: isEnabled,
  }
}

function app(args = {}) {
  let base = {name: 'myapp'}
  return Object.assign(base, args)
}

describe('ps:type', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('displays cost/hour and max cost/month for all individually-priced dyno sizes', function () {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload(true))
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [
        {type: 'web', quantity: 1, size: 'Eco'},
        {type: 'web', quantity: 1, size: 'Basic'},
        {type: 'web', quantity: 1, size: 'Standard-1X'},
        {type: 'web', quantity: 1, size: 'Standard-2X'},
        {type: 'web', quantity: 1, size: 'Performance-M'},
        {type: 'web', quantity: 1, size: 'Performance-L'},
        {type: 'web', quantity: 1, size: 'Performance-L-RAM'},
        {type: 'web', quantity: 1, size: 'Performance-XL'},
        {type: 'web', quantity: 1, size: 'Performance-2XL'},
      ])

    return cmd.run({app: 'myapp'})
      .then(() => {
        expect(cli.stdout).to.eq(`=== Dyno Types
type  size               qty  cost/hour  max cost/month
────  ─────────────────  ───  ─────────  ──────────────
web   Eco                1
web   Basic              1    ~$0.010    $7
web   Standard-1X        1    ~$0.035    $25
web   Standard-2X        1    ~$0.069    $50
web   Performance-M      1    ~$0.347    $250
web   Performance-L      1    ~$0.694    $500
web   Performance-L-RAM  1    ~$0.694    $500
web   Performance-XL     1    ~$1.042    $750
web   Performance-2XL    1    ~$2.083    $1500
=== Dyno Totals
type               total
─────────────────  ─────
Eco                1
Basic              1
Standard-1X        1
Standard-2X        1
Performance-M      1
Performance-L      1
Performance-L-RAM  1
Performance-XL     1
Performance-2XL    1

$5 (flat monthly fee, shared across all Eco dynos)
`)
      })
      .then(() => api.done())
  })

  it('switches to performance-l-ram dyno when feature flag is enabled', function () {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload(true))
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Eco'}])
      .patch('/apps/myapp/formation', {updates: [{type: 'web', size: 'performance-l-ram'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Performance-L-RAM'}])
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Performance-L-RAM'}])

    return cmd.run({app: 'myapp', args: ['web=performance-l-ram']})
      .then(() => expect(cli.stdout).to.eq(`=== Dyno Types
type  size               qty  cost/hour  max cost/month
────  ─────────────────  ───  ─────────  ──────────────
web   Performance-L-RAM  1    ~$0.694    $500
=== Dyno Totals
type               total
─────────────────  ─────
Performance-L-RAM  1
`))
      .then(() => expect(cli.stderr).to.eq('Scaling dynos on myapp... done\n'))
      .then(() => api.done())
  })

  it('switches to hobby dynos', function () {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Eco'}, {type: 'worker', quantity: 2, size: 'Eco'}])
      .patch('/apps/myapp/formation', {updates: [{type: 'web', size: 'basic'}, {type: 'worker', size: 'basic'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Basic'}, {type: 'worker', quantity: 2, size: 'Basic'}])
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Basic'}, {type: 'worker', quantity: 2, size: 'Basic'}])

    return cmd.run({app: 'myapp', args: ['basic']})
      .then(() => expect(cli.stdout).to.eq(`=== Dyno Types
type    size   qty  cost/hour  max cost/month
──────  ─────  ───  ─────────  ──────────────
web     Basic  1    ~$0.010    $7
worker  Basic  2    ~$0.019    $14
=== Dyno Totals
type   total
─────  ─────
Basic  3
`))
      .then(() => expect(cli.stderr).to.eq('Scaling dynos on myapp... done\n'))
      .then(() => api.done())
  })

  it('switches to standard-1x and standard-2x dynos', function () {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/apps/myapp')
      .reply(200, app())
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Eco'}, {type: 'worker', quantity: 2, size: 'Eco'}])
      .patch('/apps/myapp/formation', {updates: [{type: 'web', size: 'standard-1x'}, {type: 'worker', size: 'standard-2x'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Standard-1X'}, {type: 'worker', quantity: 2, size: 'Standard-2X'}])
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Standard-1X'}, {type: 'worker', quantity: 2, size: 'Standard-2X'}])

    return cmd.run({app: 'myapp', args: ['web=standard-1x', 'worker=standard-2x']})
      .then(() => expect(cli.stdout).to.eq(`=== Dyno Types
type    size         qty  cost/hour  max cost/month
──────  ───────────  ───  ─────────  ──────────────
web     Standard-1X  1    ~$0.035    $25
worker  Standard-2X  2    ~$0.139    $100
=== Dyno Totals
type         total
───────────  ─────
Standard-1X  1
Standard-2X  2
`))
      .then(() => expect(cli.stderr).to.eq('Scaling dynos on myapp... done\n'))
      .then(() => api.done())
  })

  it('displays Shield dynos for apps in shielded spaces', function () {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/apps/myapp')
      .reply(200, app({space: {shield: true}}))
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 0, size: 'Private-M'}, {type: 'web', quantity: 0, size: 'Private-L'}])

    return cmd.run({app: 'myapp', args: []})
      .then(() => expect(cli.stdout).to.eq(`=== Dyno Types
type  size      qty  cost/hour  max cost/month
────  ────────  ───  ─────────  ──────────────
web   Shield-M  0
web   Shield-L  0
=== Dyno Totals
type      total
────────  ─────
Shield-M  0
Shield-L  0
`))
      .then(() => api.done())
  })
})

it('errors when user requests larger dynos and feature flag is NOT enabled', function () {
  let api = nock('https://api.heroku.com')
    .get('/account/features/frontend-larger-dynos')
    .reply(200, featureFlagPayload())

  return cmd.run({app: 'myapp', args: ['web=performance-l-ram']})
    .catch(error => expect(error.message).to.eq('No such size as performance-l-ram. Use eco, basic, standard-1x, standard-2x, performance-m, performance-l, private-s, private-m, private-l, shield-s, shield-m, shield-l.'))
    .then(() => api.done())
})
