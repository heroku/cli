import {expect, test} from '@oclif/test'
const Inquirer = require('inquirer')
import sinon = require('sinon')

describe('ci', () => {
  test
    .command(['ci'])
    .catch(error => {
      expect(error.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    })
    .it('errors when not specifying a pipeline or an app')

  describe('when specifying a pipeline', () => {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'my-pipeline'}

    let testRuns: any = []
    const statusIcon = ['✓', '!', '✗', '-', '!', '?', '-']
    const statuses = ['succeeded', 'errored', 'failed', 'creating', 'cancelled', 'foo', '']
    const commit_branch = 'main'
    const commit_sha = ['d2e177a', '14a0a11', '40d9717', 'f2e574e']
    let promptStub: any = sinon.stub()

    const chosenOption = {
      pipeline: {
        id: '14402644-c207-43aa-9bc1-974a34914010',
        name: '14402644-c207-43aa-9bc1-974a34914010',
        created_at: '05/10/2023',
      },
    }

    beforeEach(() => {
      testRuns = []
      for (let i = 0; i < 20; i++) {
        testRuns.push({
          commit_branch,
          commit_sha: commit_sha[i % 4],
          number: i,
          pipeline: {id: pipeline.id},
          status: statuses[i % 7],
        })
      }
    })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {
              id: pipeline.id,
              name: pipeline.name,
            },
          ])

        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, testRuns)
      })
      .command(['ci', `--pipeline=${pipeline.name}`])
      .it('shows the latest 15 test runs', ({stdout}) => {
        expect(stdout).to.contain(`=== Showing latest test runs for the ${pipeline.name} pipeline`)

        for (let i = 7; i < 10; i++) {
          expect(stdout).to.contain(`${statusIcon[i % 7]} ${testRuns[i].number}  main   ${testRuns[i].commit_sha} ${testRuns[i].status} `)
        }

        for (let i = 10; i < 20; i++) {
          expect(stdout).to.contain(`${statusIcon[i % 7]} ${testRuns[i].number} main   ${testRuns[i].commit_sha} ${testRuns[i].status} `)
        }

        expect(stdout).not.to.contain(`${testRuns[4].number} ${testRuns[4].commit_sha}`)
      })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines/${pipeline.id}`)
          .reply(200,
            {
              id: pipeline.id,
              name: pipeline.id,
            },
          )

        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, testRuns)
      })
      .command(['ci', `--pipeline=${pipeline.id}`])
      .it('returns pipeline id', ({stdout}) => {
        expect(stdout).to.contain(`=== Showing latest test runs for the ${pipeline.id} pipeline`)
      })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [])
      })
      .command(['ci', `--pipeline=${pipeline.name}`])
      .catch(error => {
        expect(error.message).to.equal('Pipeline not found')
      })
      .it('errors if no pipeline is found')

    describe('specifying a pipeline with prompt', () => {
      before(() => {
        promptStub = sinon.stub(Inquirer, 'prompt')
        promptStub.onFirstCall().resolves(chosenOption)
      })

      test
        .stdout()
        .nock('https://api.heroku.com', api => {
          api.get(`/pipelines?eq[name]=${pipeline.name}`)
            .reply(200, [
              {
                id: pipeline.id,
                name: pipeline.id,
                created_at: '05/10/2023',
              },
              {
                id: pipeline.id,
                name: pipeline.id,
                created_at: '05/11/2023',
              },
              {
                id: pipeline.id,
                name: pipeline.id,
                created_at: '05/12/2023',
              },
            ])

          api.get(`/pipelines/${pipeline.id}/test-runs`)
            .reply(200, testRuns)
        })
        .command(['ci', `--pipeline=${pipeline.name}`])
        .it('selects a pipeline from the prompt', () => {
          expect(promptStub.calledOnce).to.equal(true)
        })

      after(() => {
        promptStub.restore()
      })
    })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {
              id: pipeline.id,
              name: pipeline.name,
            },
          ])
        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, testRuns)
      })
      .command(['ci', '--json', `--pipeline=${pipeline.name}`])
      .it('shows the latest 15 test runs in json', ({stdout}) => {
        expect(stdout).not.to.contain(`=== Showing latest test runs for the ${pipeline.name} pipeline`)
        const jsonOut = JSON.parse(stdout)
        for (let i = 0; i < 4; i++) {
          expect(jsonOut[i].commit_branch).to.equal('main')
          expect(jsonOut[i].commit_sha).to.equal(commit_sha[3 - i])
          expect(jsonOut[i].status).to.equal(statuses[5 - i])
          expect(jsonOut[i].pipeline.id).to.equal(pipeline.id)
        }
      })
  })
})
