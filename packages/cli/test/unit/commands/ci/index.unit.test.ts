import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/ci/index.js'
import {PipelineService} from '../../../../src/lib/ci/pipelines.js'
import customRunCommand from '../../../helpers/runCommand.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('ci', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('errors when not specifying a pipeline or an app', async function () {
    const {error} = await runCommand(['ci'])
    expect(error?.message).to.contain('Required flag:  --pipeline PIPELINE or --app APP')
  })

  describe('when specifying a pipeline', function () {
    const pipeline = {id: '14402644-c207-43aa-9bc1-974a34914010', name: 'my-pipeline'}

    let testRuns: any = []
    const statusIcon = ['✓', '!', '✗', '-', '!', '?', '-']
    const statuses = ['succeeded', 'errored', 'failed', 'creating', 'cancelled', 'foo', '']
    const commit_branch = 'main'
    const commit_sha = ['d2e177a', '14a0a11', '40d9717', 'f2e574e']
    let promptStub: sinon.SinonStub

    const chosenOption = {
      pipeline: {
        created_at: '05/10/2023',
        id: '14402644-c207-43aa-9bc1-974a34914010',
        name: '14402644-c207-43aa-9bc1-974a34914010',
      },
    }

    beforeEach(function () {
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

    it('shows the latest 15 test runs', async function () {
      api
        .get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {
            id: pipeline.id,
            name: pipeline.name,
          },
        ])
        .get(`/pipelines/${pipeline.id}/test-runs`)
        .reply(200, testRuns)

      const {stdout} = await runCommand(['ci', `--pipeline=${pipeline.name}`])

      expect(stdout).to.contain(`=== Showing latest test runs for the ${pipeline.name} pipeline`)

      const actual = removeAllWhitespace(stdout)
      let expected: string
      for (let i = 7; i < 10; i++) {
        expected = removeAllWhitespace(`${statusIcon[i % 7]} ${testRuns[i].number}  main   ${testRuns[i].commit_sha} ${testRuns[i].status} `)
        expect(actual).to.contain(expected)
      }

      for (let i = 10; i < 20; i++) {
        expected = removeAllWhitespace(`${statusIcon[i % 7]} ${testRuns[i].number} main   ${testRuns[i].commit_sha} ${testRuns[i].status} `)
        expect(actual).to.contain(expected)
      }

      expect(actual).not.to.contain(removeAllWhitespace(`${testRuns[4].number} ${testRuns[4].commit_sha}`))
    })

    it('returns pipeline id', async function () {
      api
        .get(`/pipelines/${pipeline.id}`)
        .reply(200,
          {
            id: pipeline.id,
            name: pipeline.id,
          },
        )
        .get(`/pipelines/${pipeline.id}/test-runs`)
        .reply(200, testRuns)

      const {stdout} = await runCommand(['ci', `--pipeline=${pipeline.id}`])

      expect(stdout).to.contain(`=== Showing latest test runs for the ${pipeline.id} pipeline`)
    })

    it('errors if no pipeline is found', async function () {
      api
        .get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [])

      const {error} = await runCommand(['ci', `--pipeline=${pipeline.name}`])

      expect(error?.message).to.equal('Pipeline not found')
    })

    describe('specifying a pipeline with prompt', function () {
      beforeEach(function () {
        promptStub = sinon.stub(PipelineService.prototype, 'promptForPipeline')
        promptStub.onFirstCall().resolves(chosenOption)
      })

      afterEach(function () {
        promptStub.restore()
      })

      it('selects a pipeline from the prompt', async function () {
        api
          .get(`/pipelines?eq[name]=${pipeline.name}`)
          .reply(200, [
            {
              created_at: '05/10/2023',
              id: pipeline.id,
              name: pipeline.id,
            },
            {
              created_at: '05/11/2023',
              id: pipeline.id,
              name: pipeline.id,
            },
            {
              created_at: '05/12/2023',
              id: pipeline.id,
              name: pipeline.id,
            },
          ])
          .get(`/pipelines/${pipeline.id}/test-runs`)
          .reply(200, testRuns)

        await customRunCommand(Cmd, [`--pipeline=${pipeline.name}`])

        expect(promptStub.calledOnce).to.equal(true)
      })
    })

    it('shows the latest 15 test runs in json', async function () {
      api
        .get(`/pipelines?eq[name]=${pipeline.name}`)
        .reply(200, [
          {
            id: pipeline.id,
            name: pipeline.name,
          },
        ])
        .get(`/pipelines/${pipeline.id}/test-runs`)
        .reply(200, testRuns)

      const {stdout} = await runCommand(['ci', '--json', `--pipeline=${pipeline.name}`])

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
