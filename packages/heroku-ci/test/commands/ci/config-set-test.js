/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci/config-set')
const Factory = require('../../lib/factory')

describe('heroku ci:config:set', function () {
  let key, pipeline, value

  beforeEach(function () {
    cli.mockConsole()
    key = 'FOO'
    value = 'bar'
    pipeline = Factory.pipeline
  })

  it('sets new config', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .patch(`/pipelines/${pipeline.id}/stage/test/config-vars`)
      .reply(200, { [key]: value })

    yield cmd.run({ args: [ `${key}=${value}` ], flags: { pipeline: pipeline.id } })

    expect(cli.stdout).to.include(key)
    expect(cli.stdout).to.include(value)

    api.done()
  })
})
