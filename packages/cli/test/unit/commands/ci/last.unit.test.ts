import {expect, test} from '@oclif/test'

describe('ci:last', () => {
  const testRunNumber = 10
  const testRunId = 'f53d34b4-c3a9-4608-a186-17257cf71d62'

  test
    .command(['ci:last'])
    .catch(error => {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    })
    .it('errors when not specifying a pipeline or an app')

  describe('when specifying an application', () => {
    const application = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}
    const pipeline = {id: '45450264-b207-467a-Abc1-999c34883645', name: 'aquafresh'}

    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${application.name}/pipeline-couplings`)
          .reply(200, {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            app: {
              id: `${application.id}`,
            },
            pipeline: {
              id: `${pipeline.id}`,
            },
            stage: 'production',
          })
        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, [])
      })
      .command(['ci:last', '--app', `${application.name}`])
      .it('warns the user that there are no CI runs', ctx => {
        expect(ctx.stderr).to.contain('No Heroku CI runs found for the specified app and/or pipeline.')
      })

    test
      .stderr()
      .nock('https://api.heroku.com', api => {
        api.get(`/apps/${application.name}/pipeline-couplings`)
          .reply(200, {})
      })
      .command(['ci:last', '--app', `${application.name}`])
      .catch(error => {
        expect(error.message).to.contain(`No pipeline found with application ${application.name}`)
      })
      .it('errors when no pipelines exist')
  })

  describe('when specifying a pipeline', () => {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {id: pipeline.id},
          ])

        api.get(`/pipelines/${pipeline.id}/test-runs/${testRunNumber}`)
          .reply(200,
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              id: testRunId,
              number: testRunNumber,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
            },
          )

        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, [
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5849 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              id: testRunId,
              number: testRunNumber,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
            },
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              id: 'testRun.id',
              number: 9,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
            },
          ])

        api.get(`/test-runs/${testRunId}/test-nodes`)
          .reply(200, [
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              id: testRunId,
              number: testRunNumber,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
              setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRunId.slice(0, 3)}/test-runs/${testRunId}`,
              output_stream_url: `https://test-output.heroku.com/streams/${testRunId.slice(0, 3)}/test-runs/${testRunId}`,
            },
          ])
      })
      .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
        testOutputAPI.get(`/${testRunId.slice(0, 3)}/test-runs/${testRunId}`)
          .reply(200, 'Test setup output')
      })
      .nock('https://test-output.heroku.com/streams', testOutputAPI => {
        testOutputAPI.get(`/${testRunId.slice(0, 3)}/test-runs/${testRunId}`)
          .reply(200, 'Test output')
      })
      .command(['ci:last', `--pipeline=${pipeline.name}`])
      .it('and a pipeline without parallel test runs it shows node output', ({stdout}) => {
        expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n')
      })
  })

  describe('when test nodes is an empty array', () => {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {id: pipeline.id},
          ])

        api.get(`/pipelines/${pipeline.id}/test-runs/${testRunNumber}`)
          .reply(200,
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              id: testRunId,
              number: testRunNumber,
              pipeline: {id: pipeline.id},
              status: 'cancelled',
            },
          )

        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, [
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5849 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              id: testRunId,
              number: testRunNumber,
              pipeline: {id: pipeline.id},
              status: 'cancelled',
            },
          ])

        api.get(`/test-runs/${testRunId}/test-nodes`)
          .reply(200, [])
      })
      .command(['ci:last', `--pipeline=${pipeline.name}`])
      .catch(error => {
        expect(error.message).to.contain(`Test run ${testRunNumber} was cancelled. No Heroku CI runs found for this pipeline.`)
      })
      .it('shows an error about not test nodes found')
  })
})
