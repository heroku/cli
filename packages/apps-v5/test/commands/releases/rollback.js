'use strict'
/* globals afterEach beforeEach commands */

const unwrap = require('../../unwrap')
const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'releases' && c.command === 'rollback')
const expect = require('chai').expect
const stdMocks = require('std-mocks')

describe('releases:rollback', function () {
  beforeEach(() => cli.mockConsole())

  afterEach(() => {
    stdMocks.restore()
  })

  it('rolls back the release', function () {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp/releases/10')
    .reply(200, {id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
    .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
    .reply(200, {})
    return cmd.run({app: 'myapp', args: {release: 'v10'}})
    .then(() => api.done())
  })

  it('rolls back to the latest release', function () {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp/releases')
    .reply(200, [{id: 'current_release', version: 41, status: 'succeeded'}, {id: 'previous_release', version: 40, status: 'succeeded'}])
    .post('/apps/myapp/releases', {release: 'previous_release'})
    .reply(200, {})
    return cmd.run({app: 'myapp', args: {}})
    .then(() => api.done())
  })

  it('does not roll back to a failed release', function () {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp/releases')
    .reply(200, [{id: 'current_release', version: 41, status: 'succeeded'}, {id: 'failed_release', version: 40, status: 'failed'}, {id: 'succeeded_release', version: 39, status: 'succeeded'}])
    .post('/apps/myapp/releases', {release: 'succeeded_release'})
    .reply(200, {})
    return cmd.run({app: 'myapp', args: {}})
    .then(() => api.done())
  })

  it('streams the release command output', function () {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
    .get('/streams/release.log')
    .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp/releases/10')
    .reply(200, {id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
    .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
    .reply(200, {version: 40, output_stream_url: 'https://busl.test/streams/release.log'})
    return cmd.run({app: 'myapp', args: {release: 'v10'}})
    .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
    .then(() => expect(unwrap(cli.stderr)).to.equal('Rolling back myapp to v40... done, v40 Rollback affects code and config vars; it doesn\'t add or remove addons. To undo, run: heroku rollback v39\n'))
    .then(() => api.done())
    .then(() => busl.done())
    .then(() => stdMocks.restore())
  })

  it('has a missing missing output', function () {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
    .get('/streams/release.log')
    .reply(404, '')
    let api = nock('https://api.heroku.com:443')
    .get('/apps/myapp/releases/10')
    .reply(200, {id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
    .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
    .reply(200, {output_stream_url: 'https://busl.test/streams/release.log'})

    return cmd.run({app: 'myapp', args: {release: 'v10'}})
    .then(() => expect(cli.stdout).to.equal('Running release command...\n'))
    .then(() => expect(cli.stderr).to.contain('Release command starting. Use `heroku releases:output` to view the log.\n'))
    .then(() => api.done())
    .then(() => busl.done())
  })
})
