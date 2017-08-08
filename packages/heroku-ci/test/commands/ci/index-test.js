/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci')[0]
const stdMocks = require('std-mocks')
const Factory = require('../../lib/factory')

describe('heroku ci', function () {
  let pipeline, runs

  beforeEach(function () {
    cli.mockConsole()

    runs = [{
      number: 123,
      commit_branch: 'foo',
      commit_sha: '1234567',
      status: 'running'
    }]

    pipeline = Factory.pipeline
  })

  it('displays recent runs', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/test-runs`)
      .reply(200, runs)

    stdMocks.use()

    yield cmd.run({ flags: { pipeline: pipeline.id } })

    stdMocks.restore()
    const { stdout } = stdMocks.flush()

    expect(stdout[0]).to.contain(runs[0].number)
    expect(stdout[0]).to.contain(runs[0].commit_branch)
    expect(stdout[0]).to.contain(runs[0].commit_sha)
    expect(stdout[0]).to.contain(runs[0].status)

    api.done()
  })

  it('displays recent runs formatted as JSON', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/pipelines/${pipeline.id}`)
      .reply(200, pipeline)
      .get(`/pipelines/${pipeline.id}/test-runs`)
      .reply(200, runs)

    yield cmd.run({ flags: { pipeline: pipeline.id, json: true } })

    expect(cli.stdout).to.include('\n    "number": 123,\n')
    api.done()
  })
})
