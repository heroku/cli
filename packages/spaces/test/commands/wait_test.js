'use strict'
/* globals describe beforeEach it */

let sinon = require('sinon')
let nock = require('nock')
let cmd = require('../../commands/wait')
let expect = require('chai').expect
let cli = require('heroku-cli-util')

let now = new Date()

describe('spaces:wait', function () {
  beforeEach(() => cli.mockConsole())

  it('waits for space to allocate and then shows space info', async function () {
    const sandbox = sinon.createSandbox()
    const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

    let api = nock('https://api.heroku.com:443', { reqheaders: { 'Accept-Expansion': 'region' } })
      .get('/spaces/my-space')
      .reply(200,
        { shield: false, name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'allocating', created_at: now })
      .get('/spaces/my-space')
      .reply(200,
        { shield: false, name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'allocated', created_at: now }
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        { state: 'enabled', sources: ['123.456.789.123'] }
      )

    await cmd.run({ flags: { space: 'my-space', interval: 0 } })

    expect(cli.stderr).to.equal(
      `Waiting for space my-space to allocate... done\n\n`)

    expect(cli.stdout).to.equal(`=== my-space
Team:         my-team
Region:       region
State:        allocated
Shield:       off
Outbound IPs: 123.456.789.123
Created at:   ${now.toISOString()}
`)

    await outbound.done()
    await api.done()

    expect(notifySpy.called).to.equal(true)
    expect(notifySpy.calledOnce).to.equal(true)

    return sandbox.restore()
  })

  it('waits for space with --json', async function () {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        { name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'allocating', created_at: now })
      .get('/spaces/my-space')
      .reply(200,
        { name: 'my-space', team: { name: 'my-team' }, region: { name: 'my-region', description: 'region' }, state: 'allocated', created_at: now }
      )
    let outbound = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/nat')
      .reply(200,
        { state: 'enabled', sources: ['123.456.789.123'] }
      )

    await cmd.run({ flags: { space: 'my-space', json: true, interval: 0 } })

    expect(cli.stderr).to.equal(
      `Waiting for space my-space to allocate... done\n\n`)

    expect(cli.stdout).to.equal(`{
  "name": "my-space",
  "team": {
    "name": "my-team"
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
`)

    await outbound.done()

    return api.done()
  })
})
