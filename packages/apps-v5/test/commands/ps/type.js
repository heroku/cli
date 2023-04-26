'use strict'
/* globals commands beforeEach */

const cli = require('heroku-cli-util')
const cmd = commands.find(c => c.topic === 'ps' && c.command === 'type')
const nock = require('nock')
const expect = require('chai').expect

function app(args = {}) {
  let base = {name: 'myapp'}
  return Object.assign(base, args)
}

describe('ps:type', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('switches to hobby dynos', function () {
    let api = nock('https://api.heroku.com')
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
type    size   qty  cost/mo
──────  ─────  ───  ───────
web     Basic  1    $7
worker  Basic  2    $14
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
type    size         qty  cost/mo
──────  ───────────  ───  ───────
web     Standard-1X  1    $25
worker  Standard-2X  2    $100
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
    .get('/apps/myapp')
    .reply(200, app({space: {shield: true}}))
    .get('/apps/myapp/formation')
    .reply(200, [{type: 'web', quantity: 0, size: 'Private-M'}, {type: 'web', quantity: 0, size: 'Private-L'}])

    return cmd.run({app: 'myapp', args: []})
    .then(() => expect(cli.stdout).to.eq(`=== Dyno Types
type  size      qty  cost/mo
────  ────────  ───  ───────
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
