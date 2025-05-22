import {expect} from '@oclif/test'
import * as telemetry from '../../src/global_telemetry.js'
import {identity} from 'lodash'
import * as os from 'os'
import * as fs from 'fs'
const {version} = JSON.parse(fs.readFileSync('../../../../packages/cli/package.json', 'utf8'))
import nock from 'nock'
const isDev = process.env.IS_DEV_ENVIRONMENT === 'true'

nock.disableNetConnect()

/*
describe('telemetry', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  const now = new Date()
  const mockCmdStartTime = now.getTime()
  const mockOs = os.platform()
  const mockConfig = {
    platform: mockOs,
    version,
  }
  const mockOpts = {
    Command: {
      id: 'pipelines:open',
    },
  }
  const mockTelemetryObject = {
    command: 'pipelines:open',
    os: mockOs,
    version,
    exitCode: 0,
    exitState: 'successful',
    cliRunDuration: 0,
    commandRunDuration: mockCmdStartTime,
    lifecycleHookCompletion: {
      init: true,
      prerun: true,
      postrun: false,
      command_not_found: false,
    },
    isVersionOrHelp: false,
  }

  const setupTelemetryTest = (config: any, opts: any) => {
    const result = telemetry.setupTelemetry(config, opts)
    expect(result!.command).to.equal(mockTelemetryObject.command)
    expect(result!.os).to.equal(mockTelemetryObject.os)
    expect(result!.version).to.equal(mockTelemetryObject.version)
    expect(result!.exitCode).to.equal(mockTelemetryObject.exitCode)
    expect(result!.exitState).to.equal(mockTelemetryObject.exitState)
    expect(result!.cliRunDuration).to.equal(mockTelemetryObject.cliRunDuration)
    expect(result!.commandRunDuration).to.greaterThan(mockTelemetryObject.commandRunDuration)
    expect(result!.lifecycleHookCompletion.init).to.equal(mockTelemetryObject.lifecycleHookCompletion.init)
    expect(result!.lifecycleHookCompletion.prerun).to.equal(mockTelemetryObject.lifecycleHookCompletion.prerun)
    expect(result!.lifecycleHookCompletion.postrun).to.equal(mockTelemetryObject.lifecycleHookCompletion.postrun)
    expect(result!.lifecycleHookCompletion.command_not_found).to.equal(mockTelemetryObject.lifecycleHookCompletion.command_not_found)
  }

  const computeDurationTest = (cmdStartTime: any) => {
    const timeDurationResult = telemetry.computeDuration(cmdStartTime)
    expect(timeDurationResult).to.greaterThan(1)
  }

  const reportCmdNotFoundTest = (config: any) => {
    mockTelemetryObject.command = 'invalid_command'
    mockTelemetryObject.exitState = 'command_not_found'
    mockTelemetryObject.commandRunDuration = 0
    mockTelemetryObject.lifecycleHookCompletion.prerun = false
    mockTelemetryObject.lifecycleHookCompletion.postrun = false
    mockTelemetryObject.lifecycleHookCompletion.command_not_found = true

    const result = telemetry.reportCmdNotFound(config)
    expect(result.command).to.equal(mockTelemetryObject.command)
    expect(result.os).to.equal(mockTelemetryObject.os)
    expect(result.version).to.equal(mockTelemetryObject.version)
    expect(result.exitCode).to.equal(mockTelemetryObject.exitCode)
    expect(result.exitState).to.equal(mockTelemetryObject.exitState)
    expect(result.cliRunDuration).to.equal(mockTelemetryObject.cliRunDuration)
    expect(result.commandRunDuration).to.equal(mockTelemetryObject.commandRunDuration)
    expect(result.lifecycleHookCompletion.init).to.equal(mockTelemetryObject.lifecycleHookCompletion.init)
    expect(result.lifecycleHookCompletion.prerun).to.equal(mockTelemetryObject.lifecycleHookCompletion.prerun)
    expect(result.lifecycleHookCompletion.postrun).to.equal(mockTelemetryObject.lifecycleHookCompletion.postrun)
    expect(result.lifecycleHookCompletion.command_not_found).to.equal(mockTelemetryObject.lifecycleHookCompletion.command_not_found)
  }

  it('confirms successful telemetry object creation', function () {
    setupTelemetryTest(mockConfig, mockOpts)
  })

  it('confirms successfully computes time duration', function () {
    computeDurationTest(mockCmdStartTime)
  })

  it('confirms successful telemetry object creation with invalid command', function () {
    reportCmdNotFoundTest(mockConfig)
  })

  it('confirms successful request to honeycomb', async function () {
    const mockTelemetry = telemetry.setupTelemetry(mockConfig, mockOpts)
    telemetry.initializeInstrumentation()

    const honeycombAPI = nock(`${isDev ? 'https://backboard.staging.herokudev.com/otel' : 'https://backboard.heroku.com/otel'}`)
      .post('/v1/traces', identity)
      .reply(200)

    await telemetry.sendToHoneycomb(mockTelemetry!)
    honeycombAPI.done()
  })

  it('confirms successful request to rollbar', async function () {
    const mockRollbarError = {name: 'testError', message: 'testMessage', stack: 'testStack', cli_run_duration: 1234}

    const rollbarAPI = nock('https://api.rollbar.com:443')
      .post('/api/1/item/', identity)
      .reply(200)

    await telemetry.sendToRollbar(mockRollbarError)
    rollbarAPI.done()
  })
})

*/
