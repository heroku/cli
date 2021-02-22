'use strict'
/* globals describe it beforeEach commands */

const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'releases' && c.command === 'output')
const expect = require('chai').expect
const stdMocks = require('std-mocks')
const unwrap = require('../../unwrap')

describe('releases:output', function () {
  beforeEach(() => cli.mockConsole())

  it('warns if there is no output available', async function() {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, { 'version': 40 })

    await cmd.run({ app: 'myapp', args: { release: 'v10' } })

    expect(cli.stdout).to.equal('');
    expect(unwrap(cli.stderr)).to.equal('Release v40 has no release output available.\n');

    return api.done()
  })

  it('shows the output from a specific release', async function() {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, { 'version': 40, output_stream_url: 'https://busl.test/streams/release.log' })

    try {
      await cmd.run({ app: 'myapp', args: { release: 'v10' } })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.equal('');
      busl.done();
      api.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('shows the output from the latest release', async function() {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{ 'version': 40, output_stream_url: 'https://busl.test/streams/release.log' }])

    try {
      await cmd.run({ app: 'myapp', args: {} })

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content');
      expect(cli.stderr).to.equal('');
      busl.done();
      api.done();

      return stdMocks.restore()
    } catch (error) {
      return stdMocks.restore()
    }
  })

  it('has a missing output', async function() {
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{ 'version': 40, output_stream_url: 'https://busl.test/streams/release.log' }])

    await cmd.run({ app: 'myapp', args: {} })

    expect(cli.stdout).to.equal('');
    expect(cli.stderr).to.contain('Release command not started yet. Please try again in a few seconds.\n');
    api.done();

    return busl.done()
  })
})
