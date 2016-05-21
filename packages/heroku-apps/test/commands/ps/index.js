'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/ps')
const expect = require('unexpected')
const strftime = require('strftime')

const hourAgo = new Date(new Date() - 60 * 60 * 1000)
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)
const hourAhead = new Date(new Date().getTime() + 60 * 60 * 1000)

function stubAccountFeature (code, body) {
  nock('https://api.heroku.com:443')
    .get('/account/features/free-2016')
    .reply(code, body)
}

function stubAccountFeatureDisabled () {
  stubAccountFeature(404, {id: 'not_found'})
}

function stubAccountQuota (code, body) {
  nock('https://api.heroku.com:443')
    .get('/account/features/free-2016')
    .reply(200, {enabled: true})

  nock('https://api.heroku.com:443')
    .get('/apps/myapp/dynos')
    .reply(200, [])

  nock('https://api.heroku.com:443', {
    reqHeaders: {'Accept': 'application/vnd.heroku+json; version=3.process_tier'}
  })
    .get('/apps/myapp')
    .reply(200, {process_tier: 'free'})

  nock('https://api.heroku.com:443')
    .get('/account')
    .reply(200, {id: '1234'})

  nock('https://api.heroku.com:443', {
    reqHeaders: {'Accept': 'application/vnd.heroku+json; version=3.account-quotas'}
  })
    .get('/accounts/1234/actions/get-quota')
    .reply(code, body)
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
        {command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}
      ])

    stubAccountFeatureDisabled()

    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to equal', `=== web (Free): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

=== run: one-off processes (1)
run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows dyno list as json', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'}
      ])

    stubAccountFeatureDisabled()

    return cmd.run({app: 'myapp', args: {}, flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', {command: 'npm start'}))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows free time remaining when free-2016 not found', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/actions/get-quota')
      .reply(200, {allow_until: hourAhead})
      .get('/apps/myapp/dynos')
      .reply(200)

    stubAccountFeature(404, {id: 'not_found'})

    let freeExpression = /^Free quota left: ([\d]+h [\d]{1,2}m|[\d]{1,2}m [\d]{1,2}s|[\d]{1,2}s])\n$/
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to match', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows free time remaining when free-2016 not enabled', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/actions/get-quota')
      .reply(200, {allow_until: hourAhead})
      .get('/apps/myapp/dynos')
      .reply(200)

    stubAccountFeature(200, {enabled: false})

    let freeExpression = /^Free quota left: ([\d]+h [\d]{1,2}m|[\d]{1,2}m [\d]{1,2}s|[\d]{1,2}s])\n$/
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to match', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows extended info', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [
        {id: 100, command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up', extended: {
          region: 'us', instance: 'instance', port: 8000, az: 'us-east', route: 'da route'
        }},
        {id: 101, command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up', extended: {
          region: 'us', instance: 'instance', port: 8000, az: 'us-east', route: 'da route'
        }}
      ])

    stubAccountFeatureDisabled()

    return cmd.run({app: 'myapp', args: {}, flags: {extended: true}})
      .then(() => expect(cli.stdout, 'to equal', `ID   Process  State                                    Region  Instance  Port  AZ       Release  Command    Route     Size
───  ───────  ───────────────────────────────────────  ──────  ────────  ────  ───────  ───────  ─────────  ────────  ────
101  run.1    up ${hourAgoStr} (~ 1h ago)  us      instance  8000  us-east           bash       da route  Free
100  web.1    up ${hourAgoStr} (~ 1h ago)  us      instance  8000  us-east           npm start  da route  Free
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows free quota remaining', function () {
    stubAccountQuota(200, {account_quota: 1000, quota_used: 1})

    let freeExpression =
`Free dyno hours quota remaining this month: 999 hrs (99%)
For more information on dyno sleeping and how to upgrade, see:
https://devcenter.heroku.com/articles/dyno-sleeping

`
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to equal', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('shows free quota remaining even when account_quota is zero', function () {
    stubAccountQuota(200, {account_quota: 0, quota_used: 0})

    let freeExpression =
`Free dyno hours quota remaining this month: 0 hrs (0%)
For more information on dyno sleeping and how to upgrade, see:
https://devcenter.heroku.com/articles/dyno-sleeping

`
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to equal', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('handles quota 404 properly', function () {
    stubAccountQuota(404, {id: 'not_found'})

    let freeExpression = ''
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to equal', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('handles quota 200 not_found properly', function () {
    stubAccountQuota(200, {id: 'not_found'})

    let freeExpression = ''
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to equal', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })

  it('does not print out for non-free apps', function () {
    stubAccountFeature(200, {enabled: true})

    nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {id: '1234'})

    nock('https://api.heroku.com:443', {
      reqHeaders: {'Accept': 'application/vnd.heroku+json; version=3.process_tier'}
    })
      .get('/apps/myapp')
      .reply(200, {process_tier: 'hobby'})

    let dynos = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [])

    let freeExpression = ''
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .then(() => expect(cli.stdout, 'to equal', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => dynos.done())
  })

  it('propegates quota 503 properly', function () {
    stubAccountQuota(503, {id: 'server_error'})

    let freeExpression = ''
    let thrown = false
    return cmd.run({app: 'myapp', args: {}, flags: {}})
      .catch(function () { thrown = true })
      .then(() => expect(thrown, 'to equal', true))
      .then(() => expect(cli.stdout, 'to equal', freeExpression))
      .then(() => expect(cli.stderr, 'to be empty'))
  })
})
