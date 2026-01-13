import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('ci:last', function () {
  const testRunNumber = 10
  const testRunId = 'f53d34b4-c3a9-4608-a186-17257cf71d62'
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('errors when not specifying a pipeline or an app', async function () {
    const {error} = await runCommand(['ci:last'])
    expect(error?.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
  })

  describe('when specifying an application', function () {
    const application = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}
    const pipeline = {id: '45450264-b207-467a-Abc1-999c34883645', name: 'aquafresh'}

    it('warns the user that there are no CI runs', async function () {
      api
        .get(`/apps/${application.name}/pipeline-couplings`)
        .reply(200, {
          app: {
            id: `${application.id}`,
          },
          id: '01234567-89ab-cdef-0123-456789abcdef',
          pipeline: {
            id: `${pipeline.id}`,
          },
          stage: 'production',
        })
        .get(`/pipelines/${pipeline.id}/test-runs`)
        .reply(200, [])

      const {stderr} = await runCommand(['ci:last', '--app', `${application.name}`])

      expect(stderr).to.contain('No Heroku CI runs found for the specified app and/or pipeline.')
    })

    it('errors when no pipelines exist', async function () {
      api
        .get(`/apps/${application.name}/pipeline-couplings`)
        .reply(200, {})

      const {error} = await runCommand(['ci:last', '--app', `${application.name}`])

      expect(error?.message).to.contain(`No pipeline found with application ${application.name}`)
    })
  })

  describe('when specifying a pipeline', function () {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}

    it('and a pipeline without parallel test runs it shows node output', async function () {
      api
        .get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {id: pipeline.id},
        ])
        .get(`/pipelines/${pipeline.id}/test-runs/${testRunNumber}`)
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
        .get(`/pipelines/${pipeline.id}/test-runs`)
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
        .get(`/test-runs/${testRunId}/test-nodes`)
        .reply(200, [
          {
            commit_branch: 'main',
            commit_message: 'Merge pull request #5848 from heroku/cli',
            commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
            id: testRunId,
            number: testRunNumber,
            output_stream_url: `https://test-output.heroku.com/streams/${testRunId.slice(0, 3)}/test-runs/${testRunId}`,
            pipeline: {id: pipeline.id},
            setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRunId.slice(0, 3)}/test-runs/${testRunId}`,
            status: 'succeeded',
          },
        ])

      nock('https://test-setup-output.heroku.com/streams')
        .get(`/${testRunId.slice(0, 3)}/test-runs/${testRunId}`)
        .reply(200, 'Test setup output')

      nock('https://test-output.heroku.com/streams')
        .get(`/${testRunId.slice(0, 3)}/test-runs/${testRunId}`)
        .reply(200, 'Test output')

      const {stdout} = await runCommand(['ci:last', `--pipeline=${pipeline.name}`])

      expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n')
    })
  })

  describe('when test nodes is an empty array', function () {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}

    it('shows an error about not test nodes found', async function () {
      api
        .get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {id: pipeline.id},
        ])
        .get(`/pipelines/${pipeline.id}/test-runs/${testRunNumber}`)
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
        .get(`/pipelines/${pipeline.id}/test-runs`)
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
        .get(`/test-runs/${testRunId}/test-nodes`)
        .reply(200, [])

      const {error} = await runCommand(['ci:last', `--pipeline=${pipeline.name}`])

      expect(error?.message).to.contain(`Test run ${testRunNumber} was cancelled. No Heroku CI runs found for this pipeline.`)
    })
  })
})
