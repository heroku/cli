import {expect, test} from '@oclif/test'

describe.only('pipelines:promote', () => {
  const apiUrl = 'https://api.heroku.com'

  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline'
  }

  const sourceApp = {
    id: '123-source-app-456',
    name: 'example-staging',
    pipeline
  }

  const targetApp1 = {
    id: '123-target-app-456',
    name: 'example-production',
    pipeline
  }

  const targetApp2 = {
    id: '456-target-app-789',
    name: 'example-production-eu',
    pipeline
  }

  const targetReleaseWithOutput = {
    id: '123-target-release-456',
    output_stream_url: 'https://busl.example/release'
  }

  const sourceCoupling = {
    app: sourceApp,
    id: '123-source-app-456',
    pipeline,
    stage: 'staging'
  }

  const targetCoupling1 = {
    app: targetApp1,
    id: '123-target-app-456',
    pipeline,
    stage: 'production'
  }

  const targetCoupling2 = {
    app: targetApp2,
    id: '456-target-app-789',
    pipeline,
    stage: 'production'
  }

  const promotion = {
    id: '123-promotion-456',
    source: {app: sourceApp},
    status: 'pending'
  }

  function mockPromotionTargets(testInstance: typeof test) {
    let pollCount = 0
    return testInstance
      .nock(apiUrl, api => {
        api
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
                  error_message: null
                },
                {
                  app: {id: targetApp2.id},
                // Return failed on the second poll loop
                  status: pollCount > 1 ? 'failed' : 'pending',
                  error_message: pollCount > 1 ? 'Because reasons' : null
                },
              ]
            ]
          })
      })
  }

  function setup(setupTest: typeof test) {
    return setupTest
      .nock('https://api.heroku.com', api => {
        api
          .get(`/apps/${sourceApp.name}/pipeline-couplings`)
          .reply(200, sourceCoupling)
          .get(`/pipelines/${pipeline.id}/pipeline-couplings`)
          .reply(200, [sourceCoupling, targetCoupling1, targetCoupling2])
          .post('/filters/apps')
          .reply(200, [sourceApp, targetApp1, targetApp2])
      })

  }

  setup(mockPromotionTargets(test))
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', api => {
      api.post('/pipeline-promotions', {
        pipeline: {id: pipeline.id},
        source: {app: {id: sourceApp.id}},
        targets: [
            {app: {id: targetApp1.id}},
            {app: {id: targetApp2.id}}
        ]
      }).reply(201, promotion)
    })
    .command(['pipelines:promote', `--app=${sourceApp.name}`])
    .it('promotes to all apps in the next stage', ctx => {
      expect(ctx.stdout).to.contain('failed')
      expect(ctx.stdout).to.contain('Because reasons')
    })

  // context('passing a `to` flag', () => {
  //   test
  //     .stdout()
  //     .stderr()
  //     .command(['pipelines:promote'])
  //     .nock('https://api.heroku.com', api => {
  //       api.post('/pipeline-promotions', {
  //         pipeline: {id: pipeline.id},
  //         source: {app: {id: sourceApp.id}},
  //         targets: [
  //           {app: {id: targetApp1.id}}
  //         ]
  //       }).reply(201, promotion)
  //     })
  //     .it('can promote by app name', ctx => {
  //       mockPromotionTargets()
  //       expect(ctx.stdout).to.contain('failed')
  //       expect(ctx.stdout).to.contain('Because reasons')
  //     })
  // })
})
