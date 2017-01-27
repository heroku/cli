'use strict'
/* globals describe it beforeEach */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../..').commands.find(c => c.topic === 'releases' && c.command === 'rollback')

describe('releases:rollback', function () {
  beforeEach(() => cli.mockConsole())

  it('rolls back the release', function () {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, { 'id': '5efa3510-e8df-4db0-a176-83ff8ad91eb5', 'version': 40 })
      .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
      .reply(200, {})
    return cmd.run({app: 'myapp', args: {release: 'v10'}})
      .then(() => api.done())
  })

  it('rolls back to the latest release', function () {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{'id': 'current_release', 'version': 41, status: 'succeeded'}, {'id': 'previous_release', 'version': 40, status: 'succeeded'}])
      .post('/apps/myapp/releases', {release: 'previous_release'})
      .reply(200, {})
    return cmd.run({app: 'myapp', args: {}})
      .then(() => api.done())
  })

  it('does not roll back to a failed release', function () {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{'id': 'current_release', 'version': 41, status: 'succeeded'}, {'id': 'failed_release', 'version': 40, status: 'failed'}, {'id': 'succeeded_release', 'version': 39, status: 'succeeded'}])
      .post('/apps/myapp/releases', {release: 'succeeded_release'})
      .reply(200, {})
    return cmd.run({app: 'myapp', args: {}})
      .then(() => api.done())
  })
})
