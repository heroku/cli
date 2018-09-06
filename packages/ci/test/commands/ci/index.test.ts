import Nock from '@fancy-test/nock'
import * as Test from '@oclif/test'
const test = Test.test
  .register('nock', Nock)
const expect = Test.expect

describe('ci', () => {
  test
    .command(['ci'])
    .catch(e => {
      expect(e.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
    })
    .it('errors when not specifying a pipeline or an app')

  describe('when specifying a pipeline', () => {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'my-pipeline'}

    let testRuns: any = []
    const statusIcon = ['✓', '!', '✗', '-']
    const statuses = ['succeeded', 'errored', 'failed', 'creating']
    const commit_branch = 'master'
    const commit_sha = ['d2e177a', '14a0a11', '40d9717', 'f2e574e']

    beforeEach(() => {
      testRuns = []
      for (let i = 0; i < 20; i++) {
        testRuns.push({
          commit_branch,
          commit_sha: commit_sha[i % 4],
          number: i,
          pipeline: {id: pipeline.id},
          status: statuses[i % 4]
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
              name: pipeline.name
            }
          ])

        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, testRuns)
      })
      .command(['ci', `--pipeline=${pipeline.name}`])
      .it('it shows the latest 15 test runs', ({stdout}) => {
        expect(stdout).to.contain(`=== Showing latest test runs for the ${pipeline.name} pipeline`)

        for (let i = 5; i < 10; i++) {
          expect(stdout).to.contain(`${statusIcon[i % 4]}  ${testRuns[i].number}   master  ${testRuns[i].commit_sha}  ${testRuns[i].status}\n`)
        }
        for (let i = 10; i < 20; i++) {
          expect(stdout).to.contain(`${statusIcon[i % 4]}  ${testRuns[i].number}  master  ${testRuns[i].commit_sha}  ${testRuns[i].status}\n`)
        }

        expect(stdout).not.to.contain(`${testRuns[4].number} ${testRuns[4].commit_sha}`)
      })

    test
      .stdout()
      .nock('https://api.heroku.com', api => {
        api.get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {
              id: pipeline.id,
              name: pipeline.name
            }
          ])

        api.get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, testRuns)
      })
      .command(['ci', '--json', `--pipeline=${pipeline.name}`])
      .it('it shows the latest 15 test runs in json', ({stdout}) => {
        expect(stdout).not.to.contain(`=== Showing latest test runs for the ${pipeline.name} pipeline`)
        let jsonOut = JSON.parse(stdout)
        for (let i = 0; i < 4; i++) {
          expect(jsonOut[i].commit_branch).to.equal('master')
          expect(jsonOut[i].commit_sha).to.equal(commit_sha[3 - i])
          expect(jsonOut[i].status).to.equal(statuses[3 - i])
          expect(jsonOut[i].pipeline.id).to.equal(pipeline.id)
        }
      })
  })
})
