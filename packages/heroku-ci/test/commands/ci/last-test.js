/* eslint-env mocha */

const nock = require('nock')
const expect = require('chai').expect
const cli = require('heroku-cli-util')
const sinon = require('sinon')
const cmd = require('../../../commands/ci/last')

describe('heroku ci:last', function () {
  let app, coupling, testRun, testNode, setupOutput, testOutput

  beforeEach(function () {
    cli.mockConsole()
    sinon.stub(process, 'exit')

    app = '123-app'

    coupling = {
      pipeline: {
        id: '123-abc',
        name: '123-abc'
      }
    }

    testRun = {
      id: '123-abc',
      number: 123,
      pipeline: coupling.pipeline,
      status: 'succeeded',
      commit_sha: '123abc456def',
      commit_branch: 'master'
    }

    testNode = {
      output_stream_url: 'https://output.com/tests',
      setup_stream_url: 'https://output.com/setup',
      test_run: { id: testRun.id },
      exit_code: 1
    }

    setupOutput = ''
    testOutput = ''
  })

  afterEach(function () {
    process.exit.restore()
  })

  it('when pipeline has runs, displays the results of the latest run', function* () {
    const api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .get(`/pipelines/${coupling.pipeline.id}/test-runs`)
      .reply(200, [testRun])
      .get(`/pipelines/${coupling.pipeline.id}/test-runs/${testRun.number}`)
      .reply(200, testRun)
      .get(`/test-runs/${testRun.id}/test-nodes`)
      .reply(200, [testNode])
      .get(`/test-runs/${testRun.id}/test-nodes`)
      .reply(200, [testNode])

    const streamAPI = nock('https://output.com')
      .get('/setup')
      .reply(200, setupOutput)
      .get('/tests')
      .reply(200, testOutput)

    yield cmd.run({ app })
    expect(cli.stdout).to.contain(`✓ #${testRun.number}`)

    api.done()
    streamAPI.done()
  })

  it('when pipeline does not have any runs, reports that there are no runs', function* () {
    let api = nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, coupling)
      .get(`/pipelines/${coupling.pipeline.id}/test-runs`)
      .reply(200, [])

    yield cmd.run({ app })
    expect(cli.stderr).to.contain('No Heroku CI runs found')
    api.done()
  })
})
