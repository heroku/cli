import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'

import PsAutoscaleDisable from '../../../../src/commands/ps/autoscale/disable.js'
import {mockSDKMetrics, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('ps:autoscale:disable', function () {
  const APP_NAME = 'wubalubadubdub'
  const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-111111111111'
  const MONITOR_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-222222222222'

  let appInfoStub: ReturnType<typeof stub>
  let monitorListStub: ReturnType<typeof stub>
  let monitorUpdateStub: ReturnType<typeof stub>
  let platformMock: ReturnType<typeof mockSDKPlatform>
  let metricsMock: ReturnType<typeof mockSDKMetrics>

  beforeEach(function () {
    appInfoStub = stub().resolves({id: APP_ID, name: APP_NAME})
    monitorListStub = stub().resolves([])
    monitorUpdateStub = stub().resolves({})

    platformMock = mockSDKPlatform({
      app: {info: appInfoStub},
    })
    metricsMock = mockSDKMetrics({
      formationMonitor: {
        list: monitorListStub,
        update: monitorUpdateStub,
      },
    })
  })

  afterEach(function () {
    platformMock.restore()
    metricsMock.restore()
  })

  context('without a web dyno/monitor', function () {
    it('throws an error', async function () {
      const {error} = await runCommand(PsAutoscaleDisable, ['--app', APP_NAME])

      expect(error?.message).to.contain(`${APP_NAME} does not have autoscale enabled`)
    })
  })

  context('with a web dyno/monitor', function () {
    it(`runs ps:autoscale:disable --app ${APP_NAME}`, async function () {
      monitorListStub.resolves([{action_type: 'scale', id: MONITOR_ID}])

      const {stderr} = await runCommand(PsAutoscaleDisable, ['--app', APP_NAME])

      expect(stderr).to.contain('Disabling dyno autoscaling... done')
      expect(monitorUpdateStub.calledOnceWith(APP_ID, 'web', MONITOR_ID, {
        is_active: false,
        op: 'GREATER_OR_EQUAL',
        period: 1,
      })).to.be.true
    })
  })
})
