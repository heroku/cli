'use strict'
/* globals beforeEach commands */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const cmd = commands.find(c => c.topic === 'releases' && c.command === 'output')
const expect = require('chai').expect
const stdMocks = require('std-mocks')
const unwrap = require('../../../unwrap')

describe('releases:output', function () {
  beforeEach(() => cli.mockConsole())

  it('warns if there is no output available', function () {
    process.stdout.columns = 80
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {version: 40})
    return cmd.run({app: 'myapp', args: {release: 'v10'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(unwrap(cli.stderr)).to.equal('Release v40 has no release output available.\n'))
      .then(() => api.done())
  })

  it('shows the output from a specific release', function () {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {version: 40, output_stream_url: 'https://busl.test/streams/release.log'})
    return cmd.run({app: 'myapp', args: {release: 'v10'}})
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => busl.done())
      .then(() => api.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })

  it('shows the output from the latest release', function () {
    stdMocks.use()
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{version: 40, output_stream_url: 'https://busl.test/streams/release.log'}])
    return cmd.run({app: 'myapp', args: {}})
      .then(() => expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content'))
      .then(() => expect(cli.stderr).to.equal(''))
      .then(() => busl.done())
      .then(() => api.done())
      .then(() => stdMocks.restore())
      .catch(() => stdMocks.restore())
  })

  it('has a missing output', function () {
    process.stdout.columns = 80
    let busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{version: 40, output_stream_url: 'https://busl.test/streams/release.log'}])

    return cmd.run({app: 'myapp', args: {}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.contain('Release command not started yet. Please try again in a few seconds.\n'))
      .then(() => api.done())
      .then(() => busl.done())
  })
})
