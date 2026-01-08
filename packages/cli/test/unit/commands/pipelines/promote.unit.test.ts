import {expect} from 'chai'
import {runCommand} from '@oclif/test'
import nock from 'nock'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/pipelines/promote.js'
import runCommandHelper from '../../../helpers/runCommand.js'

describe('pipelines:promote', function () {
  const apiUrl = 'https://api.heroku.com'

  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline',
  }

  const sourceApp = {
    id: '123-source-app-456',
    name: 'example-staging',
    pipeline,
  }

  const targetApp1 = {
    id: '123-target-app-456',
    name: 'example-production',
    pipeline,
  }

  const targetApp2 = {
    id: '456-target-app-789',
    name: 'example-production-eu',
    pipeline,
  }

  const targetReleaseWithOutput = {
    id: '123-target-release-456',
    output_stream_url: 'https://busl.example/release',
  }

  const sourceCoupling = {
    app: sourceApp,
    id: '123-source-app-456',
    pipeline,
    stage: 'staging',
  }

  const targetCoupling1 = {
    app: targetApp1,
    id: '123-target-app-456',
    pipeline,
    stage: 'production',
  }

  const targetCoupling2 = {
    app: targetApp2,
    id: '456-target-app-789',
    pipeline,
    stage: 'production',
  }

  const promotion = {
    id: '123-promotion-456',
    source: {app: sourceApp},
    status: 'pending',
  }

  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
  })

  function mockPromotionTargets() {
    let pollCount = 0
    nock(apiUrl)
      .get(`/pipeline-promotions/${promotion.id}/promotion-targets`)
      .thrice()
      .reply(function () {
        pollCount++

        return [
          200,
          [
            {
              app: {id: targetApp1.id},
              status: 'successful',
              error_message: null,
            },
            {
              app: {id: targetApp2.id},
              // Return failed on the second poll loop
              status: pollCount > 1 ? 'failed' : 'pending',
              error_message: pollCount > 1 ? 'Because reasons' : null,
            },
          ],
        ]
      })
  }

  function setupNock() {
    nock('https://api.heroku.com')
      .get(`/apps/${sourceApp.name}/pipeline-couplings`)
      .reply(200, sourceCoupling)
      .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
      .reply(200, [sourceCoupling, targetCoupling1, targetCoupling2])
      .post('/filters/apps')
      .reply(200, [sourceApp, targetApp1, targetApp2])
  }

  it('promotes to all apps in the next stage', async function () {
    setupNock()
    mockPromotionTargets()

    nock('https://api.heroku.com')
      .post('/pipeline-promotions', {
        pipeline: {id: pipeline.id},
        source: {app: {id: sourceApp.id}},
        targets: [
          {app: {id: targetApp1.id}},
          {app: {id: targetApp2.id}},
        ],
      })
      .reply(201, promotion)

    const {stdout} = await runCommand(['pipelines:promote', `--app=${sourceApp.name}`])

    expect(stdout).to.contain('failed')
    expect(stdout).to.contain('Because reasons')
  })

  context('passing a `to` flag', function () {
    it('can promote by app name', async function () {
      setupNock()
      mockPromotionTargets()

      nock('https://api.heroku.com')
        .post('/pipeline-promotions', {
          pipeline: {id: pipeline.id},
          source: {app: {id: sourceApp.id}},
          targets: [
            {app: {id: targetApp1.id}},
          ],
        })
        .reply(201, promotion)

      const {stdout} = await runCommand(['pipelines:promote', `--app=${sourceApp.name}`, `--to=${targetApp1.name}`])

      expect(stdout).to.contain('failed')
      expect(stdout).to.contain('Because reasons')
    })

    it('can promote by app id', async function () {
      setupNock()
      mockPromotionTargets()

      nock('https://api.heroku.com')
        .post('/pipeline-promotions', {
          pipeline: {id: pipeline.id},
          source: {app: {id: sourceApp.id}},
          targets: [
            {app: {id: targetApp1.id}},
          ],
        })
        .reply(201, promotion)

      const {stdout} = await runCommand(['pipelines:promote', `--app=${sourceApp.name}`, `--to=${targetApp1.id}`])

      expect(stdout).to.contain('failed')
      expect(stdout).to.contain('Because reasons')
    })
  })

  context('with release phase', function () {
    it('streams the release command output', async function () {
      setupNock()

      let pollCount = 0

      nock(apiUrl)
        .post('/pipeline-promotions', {
          pipeline: {id: pipeline.id},
          source: {app: {id: sourceApp.id}},
          targets: [
            {app: {id: targetApp1.id}},
            {app: {id: targetApp2.id}},
          ],
        })
        .reply(201, promotion)
        .get(`/apps/${targetApp1.id}/releases/${targetReleaseWithOutput.id}`)
        .reply(200, targetReleaseWithOutput)
        .get(`/pipeline-promotions/${promotion.id}/promotion-targets`)
        .twice()
        .reply(200, function () {
          pollCount++

          return [{
            app: {id: targetApp1.id},
            release: {id: targetReleaseWithOutput.id},
            status: pollCount > 1 ? 'successful' : 'pending',
            error_message: null,
          }]
        })

      nock('https://busl.example')
        .get('/release')
        .reply(200, 'Release Command Output')

      const {stdout} = await runCommand(['pipelines:promote', `--app=${sourceApp.name}`])

      expect(stdout).to.contain('Running release command')
      expect(stdout).to.contain('Release Command Output')
      expect(stdout).to.contain('successful')
    })
  })

  context('with release phase that errors', function () {
    it('attempts stream and returns error', async function () {
      sinon.stub(Cmd, 'sleep').resolves()

      setupNock()

      let pollCount = 0

      nock(apiUrl)
        .post('/pipeline-promotions', {
          pipeline: {id: pipeline.id},
          source: {app: {id: sourceApp.id}},
          targets: [
            {app: {id: targetApp1.id}},
            {app: {id: targetApp2.id}},
          ],
        })
        .reply(201, promotion)
        .get(`/apps/${targetApp1.id}/releases/${targetReleaseWithOutput.id}`)
        .reply(200, targetReleaseWithOutput)
        .get(`/pipeline-promotions/${promotion.id}/promotion-targets`)
        .reply(200, function () {
          pollCount++

          return [{
            app: {id: targetApp1.id},
            release: {id: targetReleaseWithOutput.id},
            status: pollCount > 1 ? 'successful' : 'pending',
            error_message: null,
          }]
        })

      nock('https://busl.example')
        .get('/release')
        .times(100)
        .reply(404, 'Release Command Output')

      try {
        await runCommandHelper(Cmd, [`--app=${sourceApp.name}`])
        expect.fail('Expected command to throw error')
      } catch (error: any) {
        expect(error.oclif?.exit).to.equal(2)
        expect(error.message).to.equal('stream release output not available')
      }
    })
  })
})
