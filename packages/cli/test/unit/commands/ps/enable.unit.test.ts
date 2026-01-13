import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('ps:autoscale:enable', function () {
  const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-111111111111'
  const APP_NAME = 'wubalubadubdub'
  const FORMATION_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-22222222222'
  const MONITOR_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-333333333333'
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

  function commonSetup() {
    api
      .get(`/apps/${APP_NAME}`)
      .reply(200, {generation: 'cedar', id: APP_ID, name: APP_NAME})
  }

  function dynoTestSetup(dynoType: string) {
    commonSetup()

    api
      .get(`/apps/${APP_NAME}/formation`)
      .reply(200, [{id: FORMATION_ID, size: dynoType, type: 'web'}])

    metricsApi
      .get(`/apps/${APP_ID}/formation/web/monitors`)
      .reply(200, [{
        action_type: 'scale',
        id: MONITOR_ID,
        max_quantity: 2,
        min_quantity: 1,
        value: 1000,
      }])

    metricsApi
      .patch(`/apps/${APP_ID}/formation/web/monitors/${MONITOR_ID}`)
      .reply(202, {})
  }

  describe('without specifying an app', function () {
    it('aborts the command', async function () {
      const {error} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2'])

      expect(error?.message).to.contain('Missing required flag app')
    })
  })

  describe('without specify a minimum', function () {
    it('aborts the command', async function () {
      const {error} = await runCommand(['ps:autoscale:enable', '--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain('Missing required flag min')
    })
  })

  describe('without specify a maximum', function () {
    it('aborts the command', async function () {
      const {error} = await runCommand(['ps:autoscale:enable', '--min', '1', '--app', APP_NAME])

      expect(error?.message).to.contain('Missing required flag max')
    })
  })

  describe('without an existing web dyno', function () {
    it('fails without a web dyno', async function () {
      commonSetup()

      api
        .get(`/apps/${APP_NAME}/formation`)
        .reply(200, [])

      const {error} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain(`${APP_NAME} does not have any web dynos to scale`)
    })
  })

  describe('without an existing metrics monitor', function () {
    it('successfully enabled autoscaling', async function () {
      commonSetup()

      api
        .get(`/apps/${APP_NAME}/formation`)
        .reply(200, [{id: FORMATION_ID, size: 'Performance-L', type: 'web'}])

      metricsApi
        .post(`/apps/${APP_ID}/formation/web/monitors`)
        .reply(201, [])

      metricsApi
        .get(`/apps/${APP_ID}/formation/web/monitors`)
        .reply(200)

      await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])
    })
  })

  describe('with a Performance-M dyno', function () {
    it('runs successfully', async function () {
      dynoTestSetup('Performance-M')

      const {stderr} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
    })
  })

  describe('with a Performance-L dyno', function () {
    it('runs successfully', async function () {
      dynoTestSetup('Performance-L')

      const {stderr} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
    })
  })

  describe('with a Private dyno type', function () {
    it('runs successfully', async function () {
      dynoTestSetup('private-s')

      const {stderr} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
    })
  })

  describe('with a Shield dyno type', function () {
    it('runs successfully', async function () {
      dynoTestSetup('shield-s')

      const {stderr} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
    })
  })

  describe('with a Hobby dyno', function () {
    it('rejected non-performance dynos', async function () {
      commonSetup()

      api
        .get(`/apps/${APP_NAME}/formation`)
        .reply(200, [{id: FORMATION_ID, size: 'Hobby', type: 'web'}])

      const {error} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain('Autoscaling is only available with Performance or Private dynos')
    })
  })

  describe('with a fir app', function () {
    it('rejected fir app', async function () {
      api
        .get(`/apps/${APP_NAME}`)
        .reply(200, {generation: 'fir', id: APP_ID, name: APP_NAME})

      api
        .get(`/apps/${APP_NAME}/formation`)
        .reply(200, [{id: FORMATION_ID, size: 'Performance-L', type: 'web'}])

      const {error} = await runCommand(['ps:autoscale:enable', '--min', '1', '--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain('Autoscaling is unavailable for apps in this space. See https://devcenter.heroku.com/articles/generations.')
    })
  })
})
