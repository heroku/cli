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
    .get('/account/features/free-2016')
    .reply(200, { enabled: true })

  nock('https://api.heroku.com:443')
    .get('/apps/myapp/dynos')
    .reply(200, [{ command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up' }])

  nock('https://api.heroku.com:443', {
    reqHeaders: { 'Accept': 'application/vnd.heroku+json; version=3.process_tier' }
  })
    .get('/apps/myapp')
    .reply(200, { process_tier: 'free', owner: { id: '1234' }, id: '6789' })

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

  it('shows dyno list', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [
        { command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up' },
        { command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up' }
      ])

    stubAppAndAccount()

    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(`=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

=== web (Free): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
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

  it('errors when no dynos found', function () {
    nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [
        { command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up' },
        { command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up' }
      ])

    stubAppAndAccount()

    return expect(cmd.run({ app: 'myapp', args: ['foo'], flags: {} })).to.be.rejectedWith('No foo dynos on myapp')
  })

  it('shows dyno list as json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, { id: '1234' })
      .get('/apps/myapp')
      .reply(200, { name: 'myapp' })
      .get('/apps/myapp/dynos')
      .reply(200, [
        { command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up' }
      ])

    return cmd.run({ app: 'myapp', args: [], flags: { json: true } })
      .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', { command: 'npm start' }))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows extended info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, { id: '1234' })
      .get('/apps/myapp')
      .reply(200, { name: 'myapp' })
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [
        { id: 100, command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up', extended: { region: 'us', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route' } },
        { id: 101, command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up', extended: { region: 'us', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route' } }
      ])

    return cmd.run({ app: 'myapp', args: [], flags: { extended: true } })
      .then(() => expect(cli.stdout).to.equal(`ID   Process  State                                    Region  Instance  IP        Port  AZ       Release  Command    Route     Size
───  ───────  ───────────────────────────────────────  ──────  ────────  ────────  ────  ───────  ───────  ─────────  ────────  ────
101  run.1    up ${hourAgoStr} (~ 1h ago)  us      instance  10.0.0.2  8000  us-east           bash       da route  Free
100  web.1    up ${hourAgoStr} (~ 1h ago)  us      instance  10.0.0.1  8000  us-east           npm start  da route  Free
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
        { id: 100, command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up', extended: { region: 'us', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route' } },
        { id: 101, command: 'bash', size: 'Private-L', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up', extended: { region: 'us', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route' } }
      ])

    return cmd.run({ app: 'myapp', args: [], flags: { extended: true } })
      .then(() => expect(cli.stdout).to.equal(`ID   Process  State                                    Region  Instance  IP        Port  AZ       Release  Command    Route     Size
───  ───────  ───────────────────────────────────────  ──────  ────────  ────────  ────  ───────  ───────  ─────────  ────────  ────────
101  run.1    up ${hourAgoStr} (~ 1h ago)  us      instance  10.0.0.2  8000  us-east           bash       da route  Shield-L
100  web.1    up ${hourAgoStr} (~ 1h ago)  us      instance  10.0.0.1  8000  us-east           npm start  da route  Shield-M
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows free quota remaining', function () {
    stubAccountQuota(200, { account_quota: 1000, quota_used: 1, apps: [] })

    let freeExpression =
`Free dyno hours quota remaining this month: 0h 16m (99%)
Free dyno usage for this app: 0h 0m (0%)
For more information on dyno sleeping and how to upgrade, see:
https://devcenter.heroku.com/articles/dyno-sleeping

=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`
    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('shows free quota remaining in hours and minutes', function () {
    stubAccountQuota(200, { account_quota: 3600000, quota_used: 178200, apps: [] })

    let freeExpression =
`Free dyno hours quota remaining this month: 950h 30m (95%)
Free dyno usage for this app: 0h 0m (0%)
For more information on dyno sleeping and how to upgrade, see:
https://devcenter.heroku.com/articles/dyno-sleeping

=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`
    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('shows free quota usage of free apps', function () {
    stubAccountQuota(200, { account_quota: 3600000, quota_used: 178200, apps: [{ app_uuid: '6789', quota_used: 178200 }] })

    let freeExpression =
`Free dyno hours quota remaining this month: 950h 30m (95%)
Free dyno usage for this app: 49h 30m (4%)
For more information on dyno sleeping and how to upgrade, see:
https://devcenter.heroku.com/articles/dyno-sleeping

=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`
    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('shows free quota remaining even when account_quota is zero', function () {
    stubAccountQuota(200, { account_quota: 0, quota_used: 0, apps: [] })

    let freeExpression =
`Free dyno hours quota remaining this month: 0h 0m (0%)
Free dyno usage for this app: 0h 0m (0%)
For more information on dyno sleeping and how to upgrade, see:
https://devcenter.heroku.com/articles/dyno-sleeping

=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`
    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('handles quota 404 properly', function () {
    stubAccountQuota(404, { id: 'not_found' })

    let freeExpression = `=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`

    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('handles quota 200 not_found properly', function () {
    stubAccountQuota(200, { id: 'not_found' })

    let freeExpression = `=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`
    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('does not print out for apps that are not owned', function () {
    nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, { id: '1234' })

    nock('https://api.heroku.com:443', {
      reqHeaders: { 'Accept': 'application/vnd.heroku+json; version=3.process_tier' }
    })
      .get('/apps/myapp')
      .reply(200, {
        process_tier: 'free',
        owner: { 'id': '5678' }
      })

    nock('https://api.heroku.com:443', {
      reqHeaders: { 'Accept': 'application/vnd.heroku+json; version=3.account-quotas' }
    })
      .get('/accounts/1234/actions/get-quota')
      .reply(200, { account_quota: 1000, quota_used: 1, apps: [] })

    let dynos = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [{ command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up' }])

    let freeExpression = `=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`
    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => dynos.done())
  })

  it('does not print out for non-free apps', function () {
    nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, { id: '1234' })

    nock('https://api.heroku.com:443', {
      reqHeaders: { 'Accept': 'application/vnd.heroku+json; version=3.process_tier' }
    })
      .get('/apps/myapp')
      .reply(200, { process_tier: 'hobby' })

    let dynos = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [{ command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up' }])

    let freeExpression = `=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`
    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => dynos.done())
  })

  it('traps errors properly', function () {
    stubAccountQuota(503, { id: 'server_error' })

    let freeExpression = `=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`

    return cmd.run({ app: 'myapp', args: [], flags: {} })
      .then(() => expect(cli.stdout).to.equal(freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
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
