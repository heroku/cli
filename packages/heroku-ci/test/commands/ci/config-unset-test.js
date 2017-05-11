/* eslint-env mocha */

const nock = require('nock')
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci/config-unset')
const Factory = require('../../lib/factory')

describe('heroku ci:config:unset', function () {
  let pipeline, key

  beforeEach(function () {
    cli.mockConsole()
    key = 'FOO'
    pipeline = Factory.pipeline
  })

  it('unsets config', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .patch(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, { [key]: null })

    yield cmd.run({ args: [ key ], flags: { pipeline: pipeline.id } })
    api.done()
  })
})
