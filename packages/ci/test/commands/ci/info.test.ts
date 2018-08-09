import Nock from '@fancy-test/nock'
import * as Test from '@oclif/test'

const test = Test.test
.register('nock', Nock)
const expect = Test.expect

describe('ci:info', () => {
  const testRunNumber = 10
  const testRun = {id: 'f53d34b4-c3a9-4608-a186-17257cf71d62', number: 10}

  test
  .command(['ci:info'])
  .catch(e => {
    expect(e.message).to.contain('Missing 1 required arg:\ntest-run\nSee more help with --help')
  })
  .it('errors when not specifying a test run')

  test
  .command(['ci:info', `${testRun.number}`])
  .catch(e => {
    expect(e.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
  })
  .it('errors when not specifying a pipeline or an app')

  describe('when specifying a pipeline', () => {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}

    test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [
        {id: pipeline.id}
      ])

      api.get(`/pipelines/${pipeline.id}/test-runs/${testRunNumber}`)
      .reply(200,
        {
          commit_branch: 'master',
          commit_message: 'Merge pull request #5848 from heroku/cli',
          commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
          id: testRun.id,
          number: testRun.number,
          pipeline: {id: pipeline.id},
          status: 'succeeded'
        }
      )

      api.get(`/test-runs/${testRun.id}/test-nodes`)
      .reply(200, [
        {
          commit_branch: 'master',
          commit_message: 'Merge pull request #5848 from heroku/cli',
          commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
          id: testRun.id,
          number: testRun.number,
          pipeline: {id: pipeline.id},
          status: 'succeeded',
          setup_stream_url: `https://test-output.heroku.com/streams/${testRun.id.substring(0, 3)}/test-runs/${testRun.id}`,
          output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.substring(0, 3)}/test-runs/${testRun.id}`,
        }
      ])
    })
    .nock('https://test-output.heroku.com/streams', testOutputAPI => {
      testOutputAPI.get(`${testRun.id.substring(0, 3)}/test-runs/${testRun.id}`)
      .reply(200, 'Test output')
    })
    .command(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`])
    .catch(e => {
      expect(e.message).to.contain('WTH')
    })
    .it('and a pipeline without parallel test runs it shows node output', ({stdout}) => {
      expect(stdout).to.equal('Show info here----\n')
    })
  })
})
