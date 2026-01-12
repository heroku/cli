/* eslint-disable max-nested-callbacks */
import * as Heroku from '@heroku-cli/schema'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('pipelines:info', function () {
  let api: nock.Scope

  const appNames = [
    'development-app-1',
    'development-app-2',
    'review-app-1',
    'review-app-2',
    'review-app-3',
    'review-app-4',
    'staging-app-1',
    'staging-app-2',
    'production-app-1',
  ]

  type Stage = 'development' | 'production' | 'review' | 'staging' | 'test'

  function itShowsPipelineApps(stdout: string) {
    expect(stdout).to.include('=== example')

    appNames.forEach(name => {
      expect(stdout).to.contain(name)
    })

    const expectedTable = [
      'app name             stage       \n',
      '⬢ development-app-1  development \n',
      '⬢ development-app-2  development \n',
      '⬢ review-app-1       review      \n',
      '⬢ review-app-2       review      \n',
      '⬢ review-app-3       review      \n',
      '⬢ review-app-4       review      \n',
      '⬢ staging-app-1      staging     \n',
      '⬢ staging-app-2      staging     \n',
      '⬢ production-app-1   production ',
    ]

    expectedTable.forEach(ln => {
      expect(removeAllWhitespace(stdout)).to.contain(removeAllWhitespace(ln))
    })
  }

  function setupNock(owner?: Heroku.Account) {
    const pipeline = {id: '0123', name: 'example', owner}
    const pipelines = [pipeline]
    const apps: Array<Heroku.App> = []
    const couplings: Array<Heroku.PipelineCoupling> = []

    // Build couplings
    appNames.forEach((name, id) => {
      const stage: Stage = name.split('-')[0] as Stage
      couplings.push({
        app: {id: `app-${id + 1}`},
        stage,
      })
    })

    // Build apps
    appNames.forEach((name, id) => {
      apps.push(
        {
          id: `app-${id + 1}`,
          name,
          owner: {email: 'foo@user.com', id: '1234'},
          pipeline,
        },
      )
    })

    api
      .get('/pipelines')
      .query(true)
      .reply(200, pipelines)
      .get('/pipelines/0123/pipeline-couplings')
      .reply(200, couplings)
      .post('/filters/apps')
      .reply(200, apps)

    if (owner && owner.type === 'team') {
      api.get(`/teams/${owner.id}`).reply(200, {
        id: owner.id,
        name: 'my-team',
      })
    }
  }

  function itDoesNotShowMixedOwnershipWarning(stderr: string) {
    const warningMessage = 'Some apps in this pipeline do not belong'
    expect(stderr).to.not.contain(warningMessage)
  }

  function itShowsMixedOwnershipWarning(owner: string, stderr: string) {
    const warningMessage = [
      `Warning: Some apps in this pipeline do not belong to ${owner}.`,
      'All apps in a pipeline must have the same owner as the pipeline owner.',
      'Transfer these apps or change the pipeline owner in pipeline settings.',
      'See https://devcenter.heroku.com/articles/pipeline-ownership-transition',
      'for more info.',
    ]

    warningMessage.forEach(message => {
      expect(stderr).to.contain(message)
    })
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe("when pipeline doesn't have an owner", function () {
    it('doesn\'t display the owner', async function () {
      setupNock()

      const {stdout} = await runCommand(['pipelines:info', 'example'])

      expect(stdout).to.not.contain('owner: foo@user.com')
    })

    it('displays json format', async function () {
      setupNock()

      const {stdout} = await runCommand(['pipelines:info', 'example', '--json'])

      expect(stdout).to.not.contain('owner: foo@user.com')
      const parsedOutput = JSON.parse(stdout)
      expect(parsedOutput.pipeline.name).to.equal('example')
      expect(parsedOutput.apps.length).to.equal(9)
    })
  })

  describe('when it has an owner', function () {
    describe('and type is user', function () {
      describe('with mixed pipeline ownership', function () {
        it('shows uuid instead of email', async function () {
          this.retries(3)
          const pipelineOwner = {id: '5678', type: 'user'}
          setupNock(pipelineOwner)

          const {stderr, stdout} = await runCommand(['pipelines:info', 'example'])

          const warningMessage = 'Some apps in this pipeline do not belong'
          expect(stdout).to.not.contain(warningMessage)
          expect(stdout).to.include('owner: 5678')
          itShowsMixedOwnershipWarning('5678', stderr)
          itShowsPipelineApps(stdout)
        })
      })

      describe('with same pipeline ownership', function () {
        it('displays the owner email', async function () {
          const pipelineOwner = {id: '1234', type: 'user'}
          setupNock(pipelineOwner)

          const {stderr, stdout} = await runCommand(['pipelines:info', 'example'])

          expect(stdout).to.contain('owner: foo@user.com')
          itDoesNotShowMixedOwnershipWarning(stderr)
          itShowsPipelineApps(stdout)
        })
      })
    })

    describe('and type is team', function () {
      describe('with mixed pipeline ownership', function () {
        it('displays the owner', async function () {
          const pipelineOwner = {id: '5678', type: 'team'}
          setupNock(pipelineOwner)

          const {stderr, stdout} = await runCommand(['pipelines:info', 'example'])

          expect(stdout).to.contain('owner: my-team (team)')
          itShowsPipelineApps(stdout)
          itShowsMixedOwnershipWarning('my-team (team)', stderr)
        })
      })

      describe('with homogeneous ownership', function () {
        it('displays the owner', async function () {
          const pipelineOwner = {id: '1234', type: 'team'}
          setupNock(pipelineOwner)

          const {stderr, stdout} = await runCommand(['pipelines:info', 'example'])

          expect(stdout).to.contain('owner: my-team (team)')
          itShowsPipelineApps(stdout)
          itDoesNotShowMixedOwnershipWarning(stderr)
        })
      })
    })
  })
})
