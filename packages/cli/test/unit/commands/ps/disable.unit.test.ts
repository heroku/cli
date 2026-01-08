import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

const API_HOST = 'https://api.heroku.com'
const METRICS_HOST = 'https://api.metrics.heroku.com'
const APP_NAME = 'wubalubadubdub'
const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-111111111111'
const MONITOR_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-222222222222'

describe('ps:autoscale:disable without a web dyno/monitor', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('throws an error', async function () {
    nock(API_HOST)
      .get(`/apps/${APP_NAME}`)
      .reply(200, {id: APP_ID, name: APP_NAME})

    nock(METRICS_HOST)
      .get(`/apps/${APP_ID}/formation/web/monitors`)
      .reply(200, [])

    const {error} = await runCommand(['ps:autoscale:disable', '--app', APP_NAME])

    expect(error?.message).to.contain(`${APP_NAME} does not have autoscale enabled`)
  })
})

describe('ps:autoscale:disable with a web dyno/monitor', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it(`runs ps:autoscale:disable --app ${APP_NAME}`, async function () {
    nock(API_HOST)
      .get(`/apps/${APP_NAME}`)
      .reply(200, {id: APP_ID, name: APP_NAME})

    nock(METRICS_HOST)
      .get(`/apps/${APP_ID}/formation/web/monitors`)
      .reply(200, [{action_type: 'scale', id: MONITOR_ID}])

    nock(METRICS_HOST)
      .patch(`/apps/${APP_ID}/formation/web/monitors/${MONITOR_ID}`)
      .reply(202, {})

    const {stderr} = await runCommand(['ps:autoscale:disable', '--app', APP_NAME])

    expect(stderr).to.contain('Disabling dyno autoscaling... done')
  })
})
