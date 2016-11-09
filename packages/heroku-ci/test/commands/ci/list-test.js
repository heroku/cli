/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const cmd = require('../../../commands/ci/list')
const stdMocks = require('std-mocks')

describe('heroku ci:list', function () {
  let app, coupling, runs

  beforeEach(function () {
    cli.mockConsole()
    app = '123-app'

    coupling = {
      pipeline: {
        id: '123-abc',
        name: 'test-pipeline'
      }
    }
    runs = [{
      number: 123,
      commit_branch: 'foo',
      commit_sha: '1234567',
      status: 'running'
    }]
  })

  it('displays recent runs', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .get(`/pipelines/${coupling.pipeline.id}/test-runs`)
      .reply(200, runs)

    stdMocks.use()

    yield cmd.run({ app, flags: {} })

    stdMocks.restore()
    const { stdout } = stdMocks.flush()

    expect(stdout[0]).to.contain(runs[0].number)
    expect(stdout[0]).to.contain(runs[0].commit_branch)
    expect(stdout[0]).to.contain(runs[0].commit_sha)
    expect(stdout[0]).to.contain(runs[0].status)

    api.done()
  })
})
