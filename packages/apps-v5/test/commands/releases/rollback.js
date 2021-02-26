'use strict'
/* globals describe it beforeEach commands */

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

  it('rolls back the release', async function() {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, { 'id': '5efa3510-e8df-4db0-a176-83ff8ad91eb5', 'version': 40 })
      .post('/apps/myapp/releases', { release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5' })
      .reply(200, {})
    await cmd.run({ app: 'myapp', args: { release: 'v10' } })
    return api.done()
  })

  it('rolls back to the latest release', async function() {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{ 'id': 'current_release', 'version': 41, status: 'succeeded' }, { 'id': 'previous_release', 'version': 40, status: 'succeeded' }])
      .post('/apps/myapp/releases', { release: 'previous_release' })
      .reply(200, {})
    await cmd.run({ app: 'myapp', args: {} })
    return api.done()
  })

  it('does not roll back to a failed release', async function() {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{ 'id': 'current_release', 'version': 41, status: 'succeeded' }, { 'id': 'failed_release', 'version': 40, status: 'failed' }, { 'id': 'succeeded_release', 'version': 39, status: 'succeeded' }])
      .post('/apps/myapp/releases', { release: 'succeeded_release' })
      .reply(200, {})
    await cmd.run({ app: 'myapp', args: {} })
    return api.done()
  })

  it('streams the release command output', async function() {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, { id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40 })
      .post('/apps/myapp/releases', { release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5' })
      .reply(200, { version: 40, output_stream_url: 'https://busl.test/streams/release.log' })

    await cmd.run({ app: 'myapp', args: { release: 'v10' } })

    expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
    expect(unwrap(cli.stderr)).to.equal(`Rolling back myapp to v40... done, v40 Rollback affects code and config vars; it doesn't add or remove addons. To undo, run: heroku rollback v39\n`);
    api.done();
    busl.done();

    return stdMocks.restore()
  })

  it('has a missing missing output', async function() {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, { id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40 })
      .post('/apps/myapp/releases', { release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5' })
      .reply(200, { output_stream_url: 'https://busl.test/streams/release.log' })

    await cmd.run({ app: 'myapp', args: { release: 'v10' } })

    expect(cli.stdout).to.equal('Running release command...\n');
    expect(cli.stderr).to.contain('Release command starting. Use `heroku releases:output` to view the log.\n');
    api.done();

    return busl.done()
  })
})
