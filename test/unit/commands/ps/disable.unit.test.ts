import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('ps:autoscale:disable', function () {
  const APP_NAME = 'wubalubadubdub'
  const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-111111111111'
  const MONITOR_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-222222222222'
  let api: nock.Scope
  let metricsApi: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    metricsApi = nock('https://api.metrics.heroku.com')
  })

  afterEach(function () {
    api.done()
    metricsApi.done()
    nock.cleanAll()
  })

  context('without a web dyno/monitor', function () {
    it('throws an error', async function () {
      api
        .get(`/apps/${APP_NAME}`)
        .reply(200, {id: APP_ID, name: APP_NAME})

      metricsApi
        .get(`/apps/${APP_ID}/formation/web/monitors`)
        .reply(200, [])

      const {error} = await runCommand(['ps:autoscale:disable', '--app', APP_NAME])

      expect(error?.message).to.contain(`${APP_NAME} does not have autoscale enabled`)
    })
  })

  context('with a web dyno/monitor', function () {
    it(`runs ps:autoscale:disable --app ${APP_NAME}`, async function () {
      api
        .get(`/apps/${APP_NAME}`)
        .reply(200, {id: APP_ID, name: APP_NAME})

      metricsApi
        .get(`/apps/${APP_ID}/formation/web/monitors`)
        .reply(200, [{action_type: 'scale', id: MONITOR_ID}])

      metricsApi
        .patch(`/apps/${APP_ID}/formation/web/monitors/${MONITOR_ID}`)
        .reply(202, {})

      const {stderr} = await runCommand(['ps:autoscale:disable', '--app', APP_NAME])

      expect(stderr).to.contain('Disabling dyno autoscaling... done')
    })
  })
})
