import {expect, test} from '@oclif/test'

const API_HOST = 'https://api.heroku.com'
const METRICS_HOST = 'https://api.metrics.heroku.com'
const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-111111111111'
const APP_NAME = 'wubalubadubdub'
const FORMATION_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-22222222222'
const MONITOR_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-333333333333'

describe('without specifying an app', () => {
  test
  .stderr()
  .command(['ps:autoscale:enable', '--min', '1', '--max', '2'])
  .catch(err => expect(err.message).to.contain('--app'))
  .it('aborts the command')
})

describe('without specify a minimum', () => {
  test
  .stderr()
  .command(['ps:autoscale:enable', '--max', '2', '--app', APP_NAME])
  .catch(err => expect(err.message).to.contain('--min'))
  .it('aborts the command')
})

describe('without specify a maximum', () => {
  test
  .stderr()
  .command(['ps:autoscale:enable', '--min', '1', '--app', APP_NAME])
  .catch(err => expect(err.message).to.contain('--max'))
  .it('aborts the command')
})

describe('without an existing web dyno', () => {
  commonSetup()
  .nock(API_HOST, api => api
    .get(`/apps/${APP_NAME}/formation`)
    .reply(200, [])
  )
  .command(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])
  .catch(err => expect(err.message).to.contain(`${APP_NAME} does not have any web dynos to scale`))
  .it('fails without a web dyno')
})

describe('without an existing metrics monitor', () => {
  commonSetup()
  .nock(API_HOST, api => api
    .get(`/apps/${APP_NAME}/formation`)
    .reply(200, [{id: FORMATION_ID, type: 'web', size: 'Performance-L'}])
  )
  .nock(METRICS_HOST, api => api
    .post(`/apps/${APP_ID}/formation/web/monitors`)
    .reply(201, [])
  )
  .nock(METRICS_HOST, api => api
    .get(`/apps/${APP_ID}/formation/web/monitors`)
    .reply(200)
  )
  .command(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])
  .it('successfully enabled autoscaling')
})

describe('with a Performance-M dyno', () => {
  dynoTest('Performance-M')
  .it('runs successfully', ctx => {
    expect(ctx.stderr).to.contain('Enabling dyno autoscaling... done')
  })
})

describe('with a Performance-L dyno', () => {
  dynoTest('Performance-L')
  .it('runs successfully', ctx => {
    expect(ctx.stderr).to.contain('Enabling dyno autoscaling... done')
  })
})

describe('with a Hobby dyno', () => {
  commonSetup()
  .nock(API_HOST, api => api
    .get(`/apps/${APP_NAME}/formation`)
    .reply(200, [{id: FORMATION_ID, type: 'web', size: 'Hobby'}])
  )
  .command(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])
  .catch(err => expect(err.message).to.contain('Autoscaling is only available with Performance dynos'))
  .it('rejected non-performance dynos')
})

function dynoTest(dynoType: string) {
  return commonSetup()
    .nock(API_HOST, api => api
      .get(`/apps/${APP_NAME}/formation`)
      .reply(200, [{id: FORMATION_ID, type: 'web', size: dynoType}])
    )
    .nock(METRICS_HOST, api => api
      .get(`/apps/${APP_ID}/formation/web/monitors`)
      .reply(200, [{
          id: MONITOR_ID,
          action_type: 'scale',
          min_quantity: 1,
          max_quantity: 2,
          value: 1000
        }]
      )
    )
    .nock(METRICS_HOST, api => api
      .patch(`/apps/${APP_ID}/formation/web/monitors/${MONITOR_ID}`)
      .reply(202, {})
    )
    .command(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])
}

function commonSetup() {
  return test
  .stderr()
  .nock(API_HOST, api => api
    .get(`/apps/${APP_NAME}`)
    .reply(200, {id: APP_ID, name: APP_NAME})
  )
}
