/* eslint-env mocha */

const nock = require('nock')
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci/config-unset')

describe('heroku ci:config:unset', function () {
  let app, coupling, key

  beforeEach(function () {
    cli.mockConsole()
    app = '123-app'
    key = 'FOO'

    coupling = {
      pipeline: {
        id: '123-abc',
        name: 'test-pipeline'
      }
    }
  })

  it('unsets config', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .patch(`/pipelines/${coupling.pipeline.id}/stage/test/config-vars`)
      .reply(200, { [key]: null })

    yield cmd.run({ app, args: [ key ] })

    api.done()
  })
})
