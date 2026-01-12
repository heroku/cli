import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('ci:info', function () {
  const testRunNumber = 10
  const testRun = {id: 'f53d34b4-c3a9-4608-a186-17257cf71d62', number: 10}
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('errors when not specifying a test run', async function () {
    const {error} = await runCommand(['ci:info'])
    expect(error?.message).to.equal('Missing 1 required arg:\ntest-run  auto-incremented test run number\nSee more help with --help')
  })

  it('errors when not specifying a pipeline or an app', async function () {
    const {error} = await runCommand(['ci:info', `${testRun.number}`])
    expect(error?.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
  })

  describe('when specifying a pipeline', function () {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'pipeline'}

    it('it shows the setup, test, and final result output', async function () {
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
            id: testRun.id,
            number: testRun.number,
            pipeline: {id: pipeline.id},
            status: 'succeeded',
          },
        )
        .get(`/test-runs/${testRun.id}/test-nodes`)
        .reply(200, [
          {
            commit_branch: 'main',
            commit_message: 'Merge pull request #5848 from heroku/cli',
            commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
            exit_code: 0,
            id: testRun.id,
            number: testRun.number,
            output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
            pipeline: {id: pipeline.id},
            setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
            status: 'succeeded',
          },
        ])

      nock('https://test-setup-output.heroku.com/streams')
        .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
        .reply(200, 'Test setup output')

      nock('https://test-output.heroku.com/streams')
        .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
        .reply(200, 'Test output')

      const {stdout} = await runCommand(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`])

      expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n')
    })

    describe('and the exit was not successful', function () {
      const testRunExitCode = 34

      it('it shows the setup, test, and final result output', async function () {
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
              id: testRun.id,
              number: testRun.number,
              pipeline: {id: pipeline.id},
              status: 'failed',
            },
          )
          .get(`/test-runs/${testRun.id}/test-nodes`)
          .reply(200, [
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              exit_code: testRunExitCode,
              id: testRun.id,
              number: testRun.number,
              output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
              pipeline: {id: pipeline.id},
              setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
              status: 'succeeded',
            },
          ])

        nock('https://test-setup-output.heroku.com/streams')
          .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
          .reply(200, 'Test setup output')

        nock('https://test-output.heroku.com/streams')
          .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
          .reply(200, 'Test output')

        const {error, stdout} = await runCommand(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`])

        expect(stdout).to.equal('Test setup outputTest output\n✗ #10 main:b9e982a failed\n')
        expect(error?.oclif?.exit).to.equal(testRunExitCode)
      })
    })

    describe('when the pipeline has parallel test runs enabled', function () {
      it('shows a result for each node', async function () {
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
              id: testRun.id,
              number: testRun.number,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
            },
          )
          .get(`/test-runs/${testRun.id}/test-nodes`)
          .reply(200, [
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              exit_code: 0,
              id: testRun.id,
              index: 0,
              number: testRun.number,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
            },
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              exit_code: 0,
              id: testRun.id,
              index: 1,
              number: testRun.number,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
            },
          ])

        const {stdout} = await runCommand(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`])

        expect(stdout).to.equal('✓ #10 main:b9e982a succeeded\n\n✓ #0 succeeded\n✓ #1 succeeded\n')
      })

      describe('and the user passes in a test node index', function () {
        it('displays the setup and test output for the specified node', async function () {
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
                id: testRun.id,
                number: testRun.number,
                pipeline: {id: pipeline.id},
                status: 'succeeded',
              },
            )
            .get(`/test-runs/${testRun.id}/test-nodes`)
            .reply(200, [
              {
                commit_branch: 'main',
                commit_message: 'Merge pull request #5848 from heroku/cli',
                commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                exit_code: 0,
                id: testRun.id,
                index: 0,
                number: testRun.number,
                pipeline: {id: pipeline.id},
                status: 'succeeded',
              },
              {
                commit_branch: 'main',
                commit_message: 'Merge pull request #5848 from heroku/cli',
                commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                exit_code: 0,
                id: testRun.id,
                index: 1,
                number: testRun.number,
                output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                pipeline: {id: pipeline.id},
                setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                status: 'succeeded',
              },
            ])

          nock('https://test-setup-output.heroku.com/streams')
            .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
            .reply(200, 'Test setup output')

          nock('https://test-output.heroku.com/streams')
            .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
            .reply(200, 'Test output')

          const {stdout} = await runCommand(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`, '--node=1'])

          expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n')
        })

        describe('and the pipeline does not have parallel tests enabled', function () {
          it('displays the setup and test output for the first node and a warning', async function () {
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
                  id: testRun.id,
                  number: testRun.number,
                  pipeline: {id: pipeline.id},
                  status: 'succeeded',
                },
              )
              .get(`/test-runs/${testRun.id}/test-nodes`)
              .reply(200, [
                {
                  commit_branch: 'main',
                  commit_message: 'Merge pull request #5848 from heroku/cli',
                  commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                  exit_code: 0,
                  id: testRun.id,
                  index: 1,
                  number: testRun.number,
                  output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                  pipeline: {id: pipeline.id},
                  setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                  status: 'succeeded',
                },
              ])

            nock('https://test-setup-output.heroku.com/streams')
              .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
              .reply(200, 'Test setup output')

            nock('https://test-output.heroku.com/streams')
              .get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
              .reply(200, 'Test output')

            const {stderr, stdout} = await runCommand(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`, '--node=1'])

            expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n\n')
            expect(stderr).to.contain('Warning: This pipeline doesn\'t have parallel test runs')
          })
        })
      })
    })
  })
})
