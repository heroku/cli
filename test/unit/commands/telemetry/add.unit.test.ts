import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'

import Cmd from '../../../../src/commands/telemetry/add.js'
import {SpaceWithOutboundIps} from '../../../../src/lib/types/spaces.js'
import {firApp} from '../../../fixtures/apps/fixtures.js'
import * as spaceFixtures from '../../../fixtures/spaces/fixtures.js'
import {
  appTelemetryDrain1, grpcAppTelemetryDrain, spaceTelemetryDrain1, splunkAppTelemetryDrain,
} from '../../../fixtures/telemetry/fixtures.js'

const appId = appTelemetryDrain1.owner.id
const grpcDrainAppId = grpcAppTelemetryDrain.owner.id
const splunkDrainAppId = splunkAppTelemetryDrain.owner.id
const spaceId = spaceTelemetryDrain1.owner.id
const testEndpoint = appTelemetryDrain1.exporter.endpoint

type FakePlatform = {
  app: {info: SinonStub}
  space: {info: SinonStub}
  telemetryDrain: {create: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: stub()},
    space: {info: stub()},
    telemetryDrain: {create: stub()},
  }
}

describe('telemetry:add', function () {
  let space: SpaceWithOutboundIps
  let fakePlatform: FakePlatform

  beforeEach(function () {
    space = spaceFixtures.spaces['non-shield-space']
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('returns an error if an app, remote, or space is not set', async function () {
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--headers',
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      ])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.contain('Exactly one of the following must be provided: --app, --space')
    }
  })

  it('returns an error if values are provided for both the app and the space flags', async function () {
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--app',
        firApp.name || '',
        '--space',
        'myspace',
      ])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.contain('--space cannot also be provided when using --app')
    }
  })

  it('successfully creates a telemetry drain for an app', async function () {
    fakePlatform.app.info.resolves(firApp)
    fakePlatform.telemetryDrain.create.resolves(spaceTelemetryDrain1)

    const {stdout} = await runCommand(Cmd, [
      testEndpoint,
      '--headers',
      '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      '--app',
      appId,
      '--signals',
      'logs',
    ])

    expectOutput(stdout, `successfully added drain ${testEndpoint}`)
    expect(fakePlatform.telemetryDrain.create.calledOnce).to.equal(true)
  })

  it('successfully creates a telemetry drain for a space', async function () {
    fakePlatform.space.info.resolves(space)
    fakePlatform.telemetryDrain.create.resolves(spaceTelemetryDrain1)

    const {stdout} = await runCommand(Cmd, [
      testEndpoint,
      '--headers',
      '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      '--space',
      spaceId,
      '--signals',
      'logs',
    ])

    expectOutput(stdout, `successfully added drain ${testEndpoint}`)
    expect(fakePlatform.telemetryDrain.create.calledOnce).to.equal(true)
  })

  it('does not accept options other than logs, metrics, traces, or all for the --signal flag', async function () {
    fakePlatform.space.info.resolves(space)
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--headers',
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
        '--space',
        spaceId,
        '--signals',
        'logs,foo',
      ])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.contain('Invalid signal option: logs,foo. Run heroku telemetry:add --help to see signal options.')
    }
  })

  it('returns an error when the --signal flag is set to "all" in combination with other options', async function () {
    fakePlatform.space.info.resolves(space)
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--headers',
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
        '--space',
        spaceId,
        '--signals',
        'logs,all',
      ])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.contain('Invalid signal option: logs,all. Run heroku telemetry:add --help to see signal options.')
    }
  })

  it('successfully creates a telemetry drain for an app with grpc', async function () {
    fakePlatform.app.info.resolves(firApp)
    fakePlatform.telemetryDrain.create.resolves(spaceTelemetryDrain1)

    const {stdout} = await runCommand(Cmd, [
      testEndpoint,
      '--app',
      grpcDrainAppId,
      '--transport',
      'grpc',
    ])

    expectOutput(stdout, `successfully added drain ${testEndpoint}`)
    expect(fakePlatform.telemetryDrain.create.calledOnce).to.equal(true)
  })

  it('successfully creates a telemetry drain for an app with http transport (default)', async function () {
    const httpApp = {...firApp, id: appId}
    fakePlatform.app.info.resolves(httpApp)
    fakePlatform.telemetryDrain.create.resolves(spaceTelemetryDrain1)

    const {stdout} = await runCommand(Cmd, [
      testEndpoint,
      '--app',
      appId,
      '--transport',
      'http',
    ])

    expectOutput(stdout, `successfully added drain ${testEndpoint}`)
    expect(fakePlatform.telemetryDrain.create.calledOnce).to.equal(true)
  })

  it('returns an error for invalid transport option', async function () {
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--app',
        appId,
        '--transport',
        'invalid-transport',
      ])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.contain('Expected --transport=invalid-transport to be one of: http, grpc')
    }
  })

  it('uses default http transport when no transport is specified', async function () {
    const defaultApp = {...firApp, id: appId}
    fakePlatform.app.info.resolves(defaultApp)
    fakePlatform.telemetryDrain.create.resolves(spaceTelemetryDrain1)

    const {stdout} = await runCommand(Cmd, [
      testEndpoint,
      '--app',
      appId,
    ])

    expectOutput(stdout, `successfully added drain ${testEndpoint}`)
    expect(fakePlatform.telemetryDrain.create.calledOnce).to.equal(true)
  })

  it('successfully creates a telemetry drain splunk transport', async function () {
    const splunkEndpoint = splunkAppTelemetryDrain.exporter.endpoint
    const splunkApp = {...firApp, id: splunkDrainAppId}
    fakePlatform.app.info.resolves(splunkApp)
    fakePlatform.telemetryDrain.create.resolves(splunkAppTelemetryDrain)

    const {stdout} = await runCommand(Cmd, [
      splunkEndpoint,
      '--app',
      splunkDrainAppId,
      '--transport',
      'splunk',
      '--headers',
      '{"Authorization": "Splunk your-hec-token"}',
    ])

    expectOutput(stdout, `successfully added drain ${splunkEndpoint}`)
    expect(fakePlatform.telemetryDrain.create.calledOnce).to.equal(true)
  })
})
