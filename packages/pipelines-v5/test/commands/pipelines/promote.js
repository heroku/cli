'use strict'

const expect = require('chai').expect
const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../commands/pipelines/promote')
const stdMocks = require('std-mocks')

describe('pipelines:promote', function () {
  const api = 'https://api.heroku.com'

  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline'
  }

  const sourceApp = {
    id: '123-source-app-456',
    name: 'example-staging',
    pipeline: pipeline
  }

  const targetApp1 = {
    id: '123-target-app-456',
    name: 'example-production',
    pipeline: pipeline
  }

  const targetApp2 = {
    id: '456-target-app-789',
    name: 'example-production-eu',
    pipeline: pipeline
  }

  const targetReleaseWithOutput = {
    id: '123-target-release-456',
    output_stream_url: 'https://busl.example/release'
  }

  const sourceCoupling = {
    app: sourceApp,
    id: '123-source-app-456',
    pipeline: pipeline,
    stage: 'staging'
  }

  const targetCoupling1 = {
    app: targetApp1,
    id: '123-target-app-456',
    pipeline: pipeline,
    stage: 'production'
  }

  const targetCoupling2 = {
    app: targetApp2,
    id: '456-target-app-789',
    pipeline: pipeline,
    stage: 'production'
  }

  const promotion = {
    id: '123-promotion-456',
    source: { app: sourceApp },
    status: 'pending'
  }

  function mockPromotionTargets () {
    let pollCount = 0
    return nock(api)
      .get(`/pipeline-promotions/${promotion.id}/promotion-targets`)
      .thrice()
      .reply(200, function () {
        pollCount++

        return [{
          app: { id: targetApp1.id },
          status: 'successful',
          error_message: null
        }, {
          app: { id: targetApp2.id },
          // Return failed on the second poll loop
          status: pollCount > 1 ? 'failed' : 'pending',
          error_message: pollCount > 1 ? 'Because reasons' : null
        }]
      })
  }

  beforeEach(function () {
    cli.mockConsole()

    nock(api)
      .get(`/apps/${sourceApp.name}/pipeline-couplings`)
      .reply(200, sourceCoupling)

    nock(api)
      .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
      .reply(200, [sourceCoupling, targetCoupling1, targetCoupling2])

    nock(api)
      .post(`/filters/apps`)
      .reply(200, [sourceApp, targetApp1, targetApp2])
  })

  it('promotes to all apps in the next stage', function () {
    const req = nock(api).post('/pipeline-promotions', {
      pipeline: { id: pipeline.id },
      source: { app: { id: sourceApp.id } },
      targets: [
        { app: { id: targetApp1.id } },
        { app: { id: targetApp2.id } }
      ]
    }).reply(201, promotion)

    mockPromotionTargets()

    return cmd.run({ app: sourceApp.name }).then(function () {
      req.done()
      expect(cli.stdout).to.contain('failed')
      expect(cli.stdout).to.contain('Because reasons')
    })
  })

  context('passing a `to` flag', function () {
    let req

    beforeEach(function () {
      req = nock(api).post('/pipeline-promotions', {
        pipeline: { id: pipeline.id },
        source: { app: { id: sourceApp.id } },
        targets: [
          { app: { id: targetApp1.id } }
        ]
      }).reply(201, promotion)

      mockPromotionTargets()
    })

    it('can promote by app name', function () {
      return cmd.run({
        app: sourceApp.name,
        flags: { to: targetApp1.name }
      }).then(function () {
        req.done()
        expect(cli.stdout).to.contain('failed')
        expect(cli.stdout).to.contain('Because reasons')
      })
    })

    it('can promote by app id', function () {
      return cmd.run({
        app: sourceApp.name,
        flags: { to: targetApp1.id }
      }).then(function () {
        req.done()
        expect(cli.stdout).to.contain('failed')
        expect(cli.stdout).to.contain('Because reasons')
      })
    })
  })

  context('with release phase', function () {
    let req, busl

    function mockPromotionTargetsWithRelease (release) {
      req = nock(api)
        .post('/pipeline-promotions', {
          pipeline: { id: pipeline.id },
          source: { app: { id: sourceApp.id } },
          targets: [
            { app: { id: targetApp1.id } }
          ]
        })
        .reply(201, promotion)
        .get(`/apps/${targetApp1.id}/releases/${release.id}`)
        .reply(200, targetReleaseWithOutput)
      busl = nock('https://busl.example')
        .get('/release')
        .reply(200, 'Release Command Output')

      let pollCount = 0
      nock(api)
        .get(`/pipeline-promotions/${promotion.id}/promotion-targets`)
        .twice()
        .reply(200, function () {
          pollCount++

          return [{
            app: { id: targetApp1.id },
            release: { id: release.id },
            status: pollCount > 1 ? 'successful' : 'pending',
            error_message: null
          }]
        })
    }

    it('streams the release command output', function () {
      stdMocks.use()
      mockPromotionTargetsWithRelease(targetReleaseWithOutput)

      return cmd.run({ app: sourceApp.name }).then(function () {
        req.done()
        busl.done()
        expect(cli.stdout).to.contain('Release Command Output')
        expect(cli.stdout).to.contain('successful')
      })
        .then(() => stdMocks.restore())
        .catch(() => stdMocks.restore())
    })
  })
})
