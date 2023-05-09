import {expect, test} from '@oclif/test'

const API_HOST = 'https://api.heroku.com'
const METRICS_HOST = 'https://api.metrics.heroku.com'
const APP_NAME = 'wubalubadubdub'
const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-111111111111'
const MONITOR_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-222222222222'

describe('ps:autoscale:disable without a web dyno/monitor', () => {
  test
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}`)
      .reply(200, {id: APP_ID, name: APP_NAME}),
    )
    .nock(METRICS_HOST, api => api
      .get(`/apps/${APP_ID}/formation/web/monitors`)
      .reply(200, []),
    )
    .command(['ps:autoscale:disable', '--app', APP_NAME])
    .catch(error => expect(error.message).to.contain(`${APP_NAME} does not have autoscale enabled`))
    .it('throws an error')
})

describe('ps:autoscale:disable with a web dyno/monitor', () => {
  test
    .stderr()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}`)
      .reply(200, {id: APP_ID, name: APP_NAME}),
    )
    .nock(METRICS_HOST, api => api
      .get(`/apps/${APP_ID}/formation/web/monitors`)
      .reply(200, [{id: MONITOR_ID, action_type: 'scale'}]),
    )
    .nock(METRICS_HOST, api => api
      .patch(`/apps/${APP_ID}/formation/web/monitors/${MONITOR_ID}`)
      .reply(202, {}),
    )
    .command(['ps:autoscale:disable', '--app', APP_NAME])
    .it(`runs ps:autoscale:disable --app ${APP_NAME}`, ctx => {
      expect(ctx.stderr).to.contain('Disabling dyno autoscaling... done')
    })
})
