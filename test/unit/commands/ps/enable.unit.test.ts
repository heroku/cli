import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {stub} from 'sinon'

import PsAutoscaleEnable from '../../../../src/commands/ps/autoscale/enable.js'
import {mockSDKMetrics, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('ps:autoscale:enable', function () {
  const APP_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-111111111111'
  const APP_NAME = 'wubalubadubdub'
  const MONITOR_ID = 'AAAAAAAA-BBBB-CCCC-DDDD-333333333333'

  let appInfoStub: ReturnType<typeof stub>
  let formationListStub: ReturnType<typeof stub>
  let monitorListStub: ReturnType<typeof stub>
  let monitorCreateStub: ReturnType<typeof stub>
  let monitorUpdateStub: ReturnType<typeof stub>
  let platformMock: ReturnType<typeof mockSDKPlatform>
  let metricsMock: ReturnType<typeof mockSDKMetrics>

  beforeEach(function () {
    appInfoStub = stub().resolves({generation: 'cedar', id: APP_ID, name: APP_NAME})
    formationListStub = stub().resolves([])
    monitorListStub = stub().resolves([])
    monitorCreateStub = stub().resolves({})
    monitorUpdateStub = stub().resolves({})

    platformMock = mockSDKPlatform({
      app: {info: appInfoStub},
      formation: {list: formationListStub},
    })
    metricsMock = mockSDKMetrics({
      formationMonitor: {
        create: monitorCreateStub,
        list: monitorListStub,
        update: monitorUpdateStub,
      },
    })
  })

  afterEach(function () {
    platformMock.restore()
    metricsMock.restore()
  })

  function dynoTestSetup(dynoType: string) {
    formationListStub.resolves([{id: 'formation-1', size: dynoType, type: 'web'}])
    monitorListStub.resolves([{
      action_type: 'scale',
      id: MONITOR_ID,
      max_quantity: 2,
      min_quantity: 1,
      value: 1000,
    }])
  }

  describe('without specifying an app', function () {
    it('aborts the command', async function () {
      const {error} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2'])

      expect(error?.message).to.contain('Missing required flag app')
    })
  })

  describe('without specify a minimum', function () {
    it('aborts the command', async function () {
      const {error} = await runCommand(PsAutoscaleEnable, ['--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain('Missing required flag min')
    })
  })

  describe('without specify a maximum', function () {
    it('aborts the command', async function () {
      const {error} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--app', APP_NAME])

      expect(error?.message).to.contain('Missing required flag max')
    })
  })

  describe('without an existing web dyno', function () {
    it('fails without a web dyno', async function () {
      formationListStub.resolves([])

      const {error} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain(`${APP_NAME} does not have any web dynos to scale`)
    })
  })

  describe('without an existing metrics monitor', function () {
    it('successfully enabled autoscaling', async function () {
      formationListStub.resolves([{id: 'formation-1', size: 'Performance-L', type: 'web'}])
      monitorListStub.resolves([])

      await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(monitorCreateStub.calledOnceWith(APP_ID, 'web')).to.be.true
      expect(monitorUpdateStub.called).to.be.false
    })
  })

  describe('with a Performance-M dyno', function () {
    it('runs successfully', async function () {
      dynoTestSetup('Performance-M')

      const {stderr} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
      expect(monitorUpdateStub.calledOnceWith(APP_ID, 'web', MONITOR_ID)).to.be.true
    })
  })

  describe('with a Performance-L dyno', function () {
    it('runs successfully', async function () {
      dynoTestSetup('Performance-L')

      const {stderr} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
    })
  })

  describe('with a Private dyno type', function () {
    it('runs successfully', async function () {
      dynoTestSetup('private-s')

      const {stderr} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
    })
  })

  describe('with a Shield dyno type', function () {
    it('runs successfully', async function () {
      dynoTestSetup('shield-s')

      const {stderr} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(stderr).to.contain('Enabling dyno autoscaling... done')
    })
  })

  describe('with a Hobby dyno', function () {
    it('rejected non-performance dynos', async function () {
      formationListStub.resolves([{id: 'formation-1', size: 'Hobby', type: 'web'}])

      const {error} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain('Autoscaling is only available with Performance or Private dynos')
    })
  })

  describe('with a fir app', function () {
    it('rejected fir app', async function () {
      appInfoStub.resolves({generation: 'fir', id: APP_ID, name: APP_NAME})
      formationListStub.resolves([{id: 'formation-1', size: 'Performance-L', type: 'web'}])

      const {error} = await runCommand(PsAutoscaleEnable, ['--min', '1', '--max', '2', '--app', APP_NAME])

      expect(error?.message).to.contain('Autoscaling is unavailable for apps in this space. See https://devcenter.heroku.com/articles/generations.')
    })
  })
})
