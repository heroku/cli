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

describe('ps', function () {
  beforeEach(() => cli.mockConsole())

  it('shows dyno list', function () {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}
      ])
    return cmd.run({app: 'myapp', flags: {}})
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
    return cmd.run({app: 'myapp', flags: {json: true}})
      .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', {command: 'npm start'}))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })

  it('shows free time remaining', function () {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/actions/get-quota')
      .reply(200, {allow_until: hourAhead})
      .get('/apps/myapp/dynos')
      .reply(200)

    let freeExpression = /^Free quota left: ([\d]+h [\d]{1,2}m|[\d]{1,2}m [\d]{1,2}s|[\d]{1,2}s])\n$/
    return cmd.run({app: 'myapp', flags: {}})
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
    return cmd.run({app: 'myapp', flags: {extended: true}})
      .then(() => expect(cli.stdout, 'to equal', `ID   Process  State                                    Region  Instance  Port  AZ       Release  Command    Route     Size
───  ───────  ───────────────────────────────────────  ──────  ────────  ────  ───────  ───────  ─────────  ────────  ────
101  run.1    up ${hourAgoStr} (~ 1h ago)  us      instance  8000  us-east           bash       da route  Free
100  web.1    up ${hourAgoStr} (~ 1h ago)  us      instance  8000  us-east           npm start  da route  Free
`))
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => api.done())
  })
})
