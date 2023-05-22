'use strict'
/* globals beforeEach */

const nock = require('nock')
const cmd = require('../../commands/ps')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const strftime = require('strftime')

const hourAgo = new Date(Date.now() - (60 * 60 * 1000))
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)

const spaceDynos = [
  {
    app_id: 'app_id1',
    app_name: 'app_name1',
    dynos: [
      {command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgoStr, state: 'up'},
      {command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgoStr, state: 'up'},
    ],
  },
  {
    app_id: 'app_id2',
    app_name: 'app_name2',
    dynos: [
      {command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgoStr, state: 'up'},
      {command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgoStr, state: 'up'},
    ],
  },
]

const privateDynos = [
  {
    app_id: 'app_id1',
    app_name: 'app_name1',
    dynos: [
      {command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgoStr, state: 'up'},
    ],
  },
]

describe('spaces:ps', function () {
  beforeEach(() => cli.mockConsole())

  it('shows space dynos', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos').reply(200, spaceDynos)
    let apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space').reply(200, {shield: false})

    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== app_name1 web (Free): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

=== app_name1 run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

=== app_name2 web (Free): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

=== app_name2 run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`))
      .then(() => api.done())
      .then(() => apiSpace.done())
  })

  it('shows shield space dynos', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos').reply(200, privateDynos)
    let apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space').reply(200, {shield: true})

    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== app_name1 web (Shield-M): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

`))
      .then(() => api.done())
      .then(() => apiSpace.done())
  })

  it('shows private space dynos', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos').reply(200, privateDynos)
    let apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space').reply(200, {shield: false})

    return cmd.run({flags: {space: 'my-space'}})
      .then(() => expect(cli.stdout).to.equal(
        `=== app_name1 web (Private-M): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

`))
      .then(() => api.done())
      .then(() => apiSpace.done())
  })

  it('shows space dynos with --json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos').reply(200, spaceDynos)
    let apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space').reply(200, {shield: false})

    return cmd.run({flags: {space: 'my-space', json: true}})
      .then(() => expect(JSON.parse(cli.stdout)).to.eql(spaceDynos))
      .then(() => api.done())
      .then(() => apiSpace.done())
  })
})
