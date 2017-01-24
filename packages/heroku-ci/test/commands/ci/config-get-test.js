/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci/config-get')

describe('heroku ci:config:get', function () {
  let app, coupling, key, value

  beforeEach(function () {
    cli.mockConsole()
    app = '123-app'
    key = 'FOO'
    value = 'bar'

    coupling = {
      pipeline: {
        id: '123-abc',
        name: 'test-pipeline'
      }
    }
  })

  it('displays the config value', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .get(`/pipelines/${coupling.pipeline.id}/stage/test/config-vars`)
      .reply(200, { [key]: value })

    yield cmd.run({ app, args: { key }, flags: {} })

    expect(cli.stdout).to.equal(`${value}\n`)
    api.done()
  })

  it('displays config formatted for shell', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .get(`/pipelines/${coupling.pipeline.id}/stage/test/config-vars`)
      .reply(200, { [key]: value })

    yield cmd.run({ app, args: { key }, flags: { shell: true } })

    expect(cli.stdout).to.equal(`${key}=${value}\n`)
    api.done()
  })
})
