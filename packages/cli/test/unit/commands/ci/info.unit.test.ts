import {expect, test} from '@oclif/test'

describe('ci:info', function () {
  const testRunNumber = 10
  const testRun = {id: 'f53d34b4-c3a9-4608-a186-17257cf71d62', number: 10}

  test
    .command(['ci:info'])
    .catch(error => {
      expect(error.message).to.equal('Missing 1 required arg:\ntest-run  The auto incrementing test run number.\nSee more help with --help')
    })
    .it('errors when not specifying a test run')

  test
    .command(['ci:info', `${testRun.number}`])
    .catch(error => {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    })
    .it('errors when not specifying a pipeline or an app')

  describe('when specifying a pipeline', function () {
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
              id: testRun.id,
              number: testRun.number,
              pipeline: {id: pipeline.id},
              status: 'succeeded',
            },
          )

        api.get(`/test-runs/${testRun.id}/test-nodes`)
          .reply(200, [
            {
              commit_branch: 'main',
              commit_message: 'Merge pull request #5848 from heroku/cli',
              commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
              id: testRun.id,
              number: testRun.number,
              pipeline: {id: pipeline.id},
              exit_code: 0,
              status: 'succeeded',
              setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
              output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
            },
          ])
      })
      .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
        testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
          .reply(200, 'Test setup output')
      })
      .nock('https://test-output.heroku.com/streams', testOutputAPI => {
        testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
          .reply(200, 'Test output')
      })
      .command(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`])
      .it('it shows the setup, test, and final result output', ({stdout}) => {
        expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n')
      })

    describe('and the exit was not successful', function () {
      const testRunExitCode = 34
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
                id: testRun.id,
                number: testRun.number,
                pipeline: {id: pipeline.id},
                status: 'failed',
              },
            )

          api.get(`/test-runs/${testRun.id}/test-nodes`)
            .reply(200, [
              {
                commit_branch: 'main',
                commit_message: 'Merge pull request #5848 from heroku/cli',
                commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                id: testRun.id,
                number: testRun.number,
                pipeline: {id: pipeline.id},
                exit_code: testRunExitCode,
                status: 'succeeded',
                setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
              },
            ])
        })
        .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
          testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
            .reply(200, 'Test setup output')
        })
        .nock('https://test-output.heroku.com/streams', testOutputAPI => {
          testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
            .reply(200, 'Test output')
        })
        .command(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`])
        .exit(testRunExitCode)
        .it('it shows the setup, test, and final result output', ({stdout}) => {
          expect(stdout).to.equal('Test setup outputTest output\n✗ #10 main:b9e982a failed\n')
        })
    })

    describe('when the pipeline has parallel test runs enabled', function () {
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
                id: testRun.id,
                number: testRun.number,
                pipeline: {id: pipeline.id},
                status: 'succeeded',
              },
            )

          api.get(`/test-runs/${testRun.id}/test-nodes`)
            .reply(200, [
              {
                commit_branch: 'main',
                commit_message: 'Merge pull request #5848 from heroku/cli',
                commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                id: testRun.id,
                number: testRun.number,
                pipeline: {id: pipeline.id},
                exit_code: 0,
                index: 0,
                status: 'succeeded',
              },
              {
                commit_branch: 'main',
                commit_message: 'Merge pull request #5848 from heroku/cli',
                commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                id: testRun.id,
                number: testRun.number,
                pipeline: {id: pipeline.id},
                exit_code: 0,
                index: 1,
                status: 'succeeded',
              },
            ])
        })
        .command(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`])
        .it('shows a result for each node', ({stdout}) => {
          expect(stdout).to.equal('✓ #10 main:b9e982a succeeded\n\n✓ #0 succeeded\n✓ #1 succeeded\n')
        })

      describe('and the user passes in a test node index', function () {
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
                  id: testRun.id,
                  number: testRun.number,
                  pipeline: {id: pipeline.id},
                  status: 'succeeded',
                },
              )

            api.get(`/test-runs/${testRun.id}/test-nodes`)
              .reply(200, [
                {
                  commit_branch: 'main',
                  commit_message: 'Merge pull request #5848 from heroku/cli',
                  commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                  id: testRun.id,
                  number: testRun.number,
                  pipeline: {id: pipeline.id},
                  exit_code: 0,
                  index: 0,
                  status: 'succeeded',
                },
                {
                  commit_branch: 'main',
                  commit_message: 'Merge pull request #5848 from heroku/cli',
                  commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                  id: testRun.id,
                  number: testRun.number,
                  pipeline: {id: pipeline.id},
                  exit_code: 0,
                  index: 1,
                  setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                  output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                  status: 'succeeded',
                },
              ])
          })
          .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
            testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
              .reply(200, 'Test setup output')
          })
          .nock('https://test-output.heroku.com/streams', testOutputAPI => {
            testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
              .reply(200, 'Test output')
          })
          .command(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`, '--node=1'])
          .it('displays the setup and test output for the specified node', ({stdout}) => {
            expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n')
          })

        describe('and the pipeline does not have parallel tests enabled', function () {
          test
            .stdout()
            .stderr()
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
                    id: testRun.id,
                    number: testRun.number,
                    pipeline: {id: pipeline.id},
                    status: 'succeeded',
                  },
                )

              api.get(`/test-runs/${testRun.id}/test-nodes`)
                .reply(200, [
                  {
                    commit_branch: 'main',
                    commit_message: 'Merge pull request #5848 from heroku/cli',
                    commit_sha: 'b9e982a60904730510a1c9e2dd2df64aef6f0d84',
                    id: testRun.id,
                    number: testRun.number,
                    pipeline: {id: pipeline.id},
                    exit_code: 0,
                    index: 1,
                    setup_stream_url: `https://test-setup-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                    output_stream_url: `https://test-output.heroku.com/streams/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`,
                    status: 'succeeded',
                  },
                ])
            })
            .nock('https://test-setup-output.heroku.com/streams', testOutputAPI => {
              testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
                .reply(200, 'Test setup output')
            })
            .nock('https://test-output.heroku.com/streams', testOutputAPI => {
              testOutputAPI.get(`/${testRun.id.slice(0, 3)}/test-runs/${testRun.id}`)
                .reply(200, 'Test output')
            })
            .command(['ci:info', `${testRun.number}`, `--pipeline=${pipeline.name}`, '--node=1'])
            .it('displays the setup and test output for the first node and a warning', ({stdout, stderr}) => {
              expect(stdout).to.equal('Test setup outputTest output\n✓ #10 main:b9e982a succeeded\n\n')
              expect(stderr).to.contain('Warning: This pipeline doesn\'t have parallel test runs')
            })
        })
      })
    })
  })

  describe('when specifying an application', function () {
    // TODO: Check it has a similar behavior, but via pipeline couplings
  })
})
