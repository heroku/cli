/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci/config-set')

describe('heroku ci:config:set', function () {
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

  it('sets new config', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .patch(`/pipelines/${coupling.pipeline.id}/stage/test/config-vars`)
      .reply(200, { [key]: value })

    yield cmd.run({ app, args: [ `${key}=${value}` ] })

    expect(cli.stdout).to.include(key)
    expect(cli.stdout).to.include(value)

    api.done()
  })
})
