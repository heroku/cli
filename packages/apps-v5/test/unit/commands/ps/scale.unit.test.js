'use strict'
/* globals beforeEach afterEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'ps' && c.command === 'scale')
const {expect} = require('chai')

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

describe('ps:scale', () => {
  beforeEach(() => cli.mockConsole())

  afterEach(() => nock.cleanAll())

  it('shows formation with no args', () => {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Free'}, {type: 'worker', quantity: 2, size: 'Free'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    return cmd.run({app: 'myapp', args: []})
      .then(() => expect(cli.stdout).to.equal('web=1:Free worker=2:Free\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('scales up a new large dyno size if feature flag is enabled', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload(true))
      .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '1', size: 'Performance-L-RAM'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Performance-L-RAM'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    return cmd.run({app: 'myapp', args: ['web=1:Performance-L-RAM']})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.equal('Scaling dynos... done, now running web at 1:Performance-L-RAM\n'))
      .then(() => api.done())
  })

  it('shows formation with shield dynos for apps in a shielded private space', () => {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Private-L'}, {type: 'worker', quantity: 2, size: 'Private-M'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', space: {shield: true}})

    return cmd.run({app: 'myapp', args: []})
      .then(() => expect(cli.stdout).to.equal('web=1:Shield-L worker=2:Shield-M\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('errors with no process types', () => {
    let api = nock('https://api.heroku.com')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    return expect(cmd.run({app: 'myapp', args: []}))
      .to.be.rejectedWith(Error, /^No process types on myapp./)
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('scales web=1 worker=2', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
      .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '1'}, {type: 'worker', quantity: '2'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Free'}, {type: 'worker', quantity: 2, size: 'Free'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    return cmd.run({app: 'myapp', args: ['web=1', 'worker=2']})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.equal('Scaling dynos... done, now running web at 1:Free, worker at 2:Free\n'))
      .then(() => api.done())
  })

  it('scales up a shield dyno if the app is in a shielded private space', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
      .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '1', size: 'Private-L'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Private-L'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', space: {shield: true}})

    return cmd.run({app: 'myapp', args: ['web=1:Shield-L']})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.equal('Scaling dynos... done, now running web at 1:Shield-L\n'))
      .then(() => api.done())
  })

  it('scales web-1', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/frontend-larger-dynos')
      .reply(200, featureFlagPayload())
      .get('/dyno-sizes')
      .reply(200, availableDynoSizes)
      .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '+1'}]})
      .reply(200, [{type: 'web', quantity: 2, size: 'Free'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    return cmd.run({app: 'myapp', args: ['web+1']})
      .then(() => expect(cli.stdout, 'to be empty'))
      .then(() => expect(cli.stderr).to.equal('Scaling dynos... done, now running web at 2:Free\n'))
      .then(() => api.done())
  })
})

it('errors if user attempts to scale up using new larger dyno size and feature flag is NOT enabled', function () {
  let api = nock('https://api.heroku.com')
    .get('/account/features/frontend-larger-dynos')
    .reply(200, featureFlagPayload())
    .get('/dyno-sizes')
    .reply(200, availableDynoSizes)

  return cmd.run({app: 'myapp', args: ['web=1:Performance-L-RAM']})
    .catch(error => expect(error.message).to.eq('No such size as Performance-L-RAM. Use Standard-1X, Standard-2X, Performance-M, Performance-L, Private-S, Private-M, Private-L, Shield-M, Shield-L, Shield-S, Eco, Basic'))
    .then(() => api.done())
})
