'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../src/commands/ps')
const { expect } = require('chai')
const strftime = require('strftime')

const hourAgo = new Date(new Date() - 60 * 60 * 1000)
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)

function stubAccountQuota (code, body) {
  nock('https://api.heroku.com:443')
    .get('/account')
    .reply(200, { id: '1234' })

  nock('https://api.heroku.com:443', {
    reqHeaders: { 'Accept': 'application/vnd.heroku+json; version=3.account-quotas' }
  })
    .get('/accounts/1234/actions/get-quota')
    .reply(code, body)
}

function stubAppAndAccount () {
  nock('https://api.heroku.com:443', {
    reqHeaders: { 'Accept': 'application/vnd.heroku+json; version=3.process_tier' }
  })
    .get('/apps/myapp')
    .reply(200, { process_tier: 'hobby' })

  nock('https://api.heroku.com:443')
    .get('/account')
    .reply(200, { id: '1234' })
}

describe('ps', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  it('shows shield dynos in dyno list for apps in a shielded private space', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, { space: { shield: true } })
      .get('/apps/myapp/dynos')
      .reply(200, [
        { command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up' },
        { command: 'bash', size: 'Private-L', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up' }
      ])

    stubAppAndAccount()

    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(`=== run: one-off processes (1)
run.1 (Shield-L): up ${hourAgoStr} (~ 1h ago): bash

=== web (Shield-M): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows shield dynos in extended info if app is in a shielded private space', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, { id: '1234' })
      .get('/apps/myapp')
      .reply(200, { space: { shield: true } })
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [
        { id: 100, command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up', extended: { region: 'us', execution_plane: 'execution_plane', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route' } },
        { id: 101, command: 'bash', size: 'Private-L', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up', extended: { region: 'us', execution_plane: 'execution_plane', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route' } }
      ])

    return cmd.run({ app: 'myapp', args: [], flags: { extended: true } })
      .then(() => expect(cli.stdout).to.equal(`ID   Process  State                                    Region  Execution Plane  Instance  IP        Port  AZ       Release  Command    Route     Size
───  ───────  ───────────────────────────────────────  ──────  ───────────────  ────────  ────────  ────  ───────  ───────  ─────────  ────────  ────────
101  run.1    up ${hourAgoStr} (~ 1h ago)  us      execution_plane  instance  10.0.0.2  8000  us-east           bash       da route  Shield-L
100  web.1    up ${hourAgoStr} (~ 1h ago)  us      execution_plane  instance  10.0.0.1  8000  us-east           npm start  da route  Shield-M
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('logs to stdout and exits zero when no dynos', function () {
    let dynos = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [])

    stubAppAndAccount()

    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal('No dynos on myapp\n'))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => dynos.done())
  })
})
