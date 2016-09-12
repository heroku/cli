'use strict'
/* globals describe beforeEach it */

let nock = require('nock')
let cmd = require('../../commands/wait')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces:wait', function () {
  beforeEach(() => cli.mockConsole())

  it('waits for space to allocate and then shows space info', function () {
    let api = nock('https://api.heroku.com:443', {reqheaders: {'Accept-Expansion': 'region'}})
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region', description: 'region'}, state: 'allocating', created_at: now})
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region', description: 'region'}, state: 'allocated', created_at: now}
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        {state: 'enabled', sources: ['123.456.789.123']}
      )

    return cmd.run({flags: {space: 'my-space', interval: 0}})
      .then(() => expect(cli.stderr).to.equal(
        `Waiting for space my-space to allocate... done\n\n`))
      .then(() => expect(cli.stdout).to.equal(`=== my-space
Organization: my-org
Region:       region
State:        allocated
Outbound IPs: 123.456.789.123
Created at:   ${now.toISOString()}
`))
      .then(() => outbound.done())
      .then(() => api.done())
  })

  it('waits for space with --json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region', description: 'region'}, state: 'allocating', created_at: now})
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region', description: 'region'}, state: 'allocated', created_at: now}
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        {state: 'enabled', sources: ['123.456.789.123']}
      )

    return cmd.run({flags: {space: 'my-space', json: true, interval: 0}})
      .then(() => expect(cli.stderr).to.equal(
        `Waiting for space my-space to allocate... done\n\n`))
      .then(() => expect(cli.stdout).to.equal(`{
  "name": "my-space",
  "organization": {
    "name": "my-org"
  },
  "region": {
    "name": "my-region",
    "description": "region"
  },
  "state": "allocated",
  "created_at": "${now.toISOString()}",
  "outbound_ips": {
    "state": "enabled",
    "sources": [
      "123.456.789.123"
    ]
  }
}
`))
      .then(() => outbound.done())
      .then(() => api.done())
  })
})
