'use strict'
/* globals commands beforeEach */

const cli = require('heroku-cli-util')
const cmd = commands.find(c => c.topic === 'ps' && c.command === 'type')
const nock = require('nock')
const expect = require('chai').expect

const availableDynoSizes = [
  {
    id: '03307558-da97-4417-b1b3-e7f23b565422',
    compute: 1,
    dedicated: false,
    memory: 0.5,
    name: 'Standard-1X',
    cost: {
      cents: 2500,
      unit: 'monthly',
    },
    dyno_units: 1,
    precise_dyno_units: 1,
    private_space_only: false,
  },
  {
    id: '28c44219-0905-4318-8bb7-c2dda860e472',
    compute: 2,
    dedicated: false,
    memory: 1,
    name: 'Standard-2X',
    cost: {
      cents: 5000,
      unit: 'monthly',
    },
    dyno_units: 2,
    precise_dyno_units: 2,
    private_space_only: false,
  },
  {
    id: '808d31e7-300c-4313-9af3-bc7b69639ef3',
    compute: 11,
    dedicated: true,
    memory: 2.5,
    name: 'Performance-M',
    cost: {
      cents: 25000,
      unit: 'monthly',
    },
    dyno_units: 8,
    precise_dyno_units: 8,
    private_space_only: false,
  },
  {
    id: 'b711833f-ffa6-478f-82a3-30e071c32485',
    compute: 46,
    dedicated: true,
    memory: 14,
    name: 'Performance-L',
    cost: {
      cents: 50000,
      unit: 'monthly',
    },
    dyno_units: 16,
    precise_dyno_units: 16,
    private_space_only: false,
  },
  {
    id: 'c5ccc7a9-16ae-4bca-9247-7630c8d00a82',
    compute: 2,
    dedicated: true,
    memory: 1,
    name: 'Private-S',
    cost: {
      cents: null,
      unit: null,
    },
    dyno_units: 5,
    precise_dyno_units: 5,
    private_space_only: true,
  },
  {
    id: '5d6efb3e-ad8b-4518-ae8d-88540116d92c',
    compute: 14,
    dedicated: true,
    memory: 2.5,
    name: 'Private-M',
    cost: {
      cents: null,
      unit: null,
    },
    dyno_units: 10,
    precise_dyno_units: 10,
    private_space_only: true,
  },
  {
    id: 'e29ee54f-6988-4810-aaac-d17d55d8a022',
    compute: 52,
    dedicated: true,
    memory: 14,
    name: 'Private-L',
    cost: {
      cents: null,
      unit: null,
    },
    dyno_units: 20,
    precise_dyno_units: 20,
    private_space_only: true,
  },
  {
    id: 'fabceacc-cdb4-4e3c-ab42-5dd861ea4926',
    compute: 14,
    dedicated: true,
    memory: 2.5,
    name: 'Shield-M',
    cost: {
      cents: null,
      unit: null,
    },
    dyno_units: 12,
    precise_dyno_units: 12,
    private_space_only: true,
  },
  {
    id: 'a0c5f2c9-6a29-478d-80bd-52f785a9499d',
    compute: 52,
    dedicated: true,
    memory: 14,
    name: 'Shield-L',
    cost: {
      cents: null,
      unit: null,
    },
    dyno_units: 24,
    precise_dyno_units: 24,
    private_space_only: true,
  },
  {
    id: '7481b4f2-ca73-4faf-9c6d-33cab08ad6e2',
    compute: 2,
    dedicated: true,
    memory: 1,
    name: 'Shield-S',
    cost: {
      cents: null,
      unit: null,
    },
    dyno_units: 6,
    precise_dyno_units: 6,
    private_space_only: true,
  },
  {
    id: '0f5ec139-ee6b-4de6-a3fe-48d9c3d3e663',
    compute: 1,
    dedicated: false,
    memory: 0.5,
    name: 'Eco',
    cost: {
      cents: 0,
      unit: 'monthly',
    },
    dyno_units: 0,
    precise_dyno_units: 0,
    private_space_only: false,
  },
  {
    id: '5c93cdee-2bbd-4fc0-9f04-d369d1dbb962',
    compute: 1,
    dedicated: false,
    memory: 0.5,
    name: 'Basic',
    cost: {
      cents: 700,
      unit: 'monthly',
    },
    dyno_units: 0,
    precise_dyno_units: 0.28,
    private_space_only: false,
  },
]

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
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
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
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
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
    .get('/dyno-sizes')
    .reply(200, availableDynoSizes)

  return cmd.run({app: 'myapp', args: ['web=performance-l-ram']})
    .catch(error => expect(error.message).to.eq('No such size as performance-l-ram.'))
    .then(() => api.done())
})
