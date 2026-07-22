import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/telemetry/update.js'
import {appTelemetryDrain1} from '../../../fixtures/telemetry/fixtures.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  app: {info: SinonStub}
  telemetryDrain: {update: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: stub()},
    telemetryDrain: {update: stub()},
  }
}

describe('telemetry:update', function () {
  let fakePlatform: FakePlatform

  beforeEach(function () {
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('updates a telemetry drain with one field', async function () {
    const updatedAppTelemetryDrain = {...appTelemetryDrain1, signals: ['logs']}
    fakePlatform.telemetryDrain.update.resolves(updatedAppTelemetryDrain)
    fakePlatform.app.info.resolves({id: appTelemetryDrain1.owner.id, name: 'myapp'})

    const {stderr, stdout} = await runCommand(Cmd, [
      appTelemetryDrain1.id,
      '--signals',
      'logs',
    ])
    expectOutput(stderr, heredoc(`
      Updating telemetry drain ${appTelemetryDrain1.id}... done
    `))
    expectOutput(stdout, heredoc(`
      === ${updatedAppTelemetryDrain.id}
      App:       ⬢ myapp
      Signals:   ${updatedAppTelemetryDrain.signals.join(', ')}
      Endpoint:  ${updatedAppTelemetryDrain.exporter.endpoint}
      Transport: HTTP
      Headers:   {"x-honeycomb-team":"your-api-key","x-honeycomb-dataset":"your-dataset"}
    `))
  })

  it('updates a telemetry drain with multiple fields', async function () {
    const updatedAppTelemetryDrain = {
      ...appTelemetryDrain1,
      exporter: {
        endpoint: 'https://api-new.honeycomb.io/',
        headers: {
          'x-honeycomb-dataset': 'your-dataset',
          'x-honeycomb-team': 'your-api-key',
        },
        type: 'otlp',
      },
      signals: ['logs'],
    }
    fakePlatform.telemetryDrain.update.resolves(updatedAppTelemetryDrain)
    fakePlatform.app.info.resolves({id: appTelemetryDrain1.owner.id, name: 'myapp'})

    const {stderr, stdout} = await runCommand(Cmd, [
      appTelemetryDrain1.id,
      '--signals',
      'logs',
      '--endpoint',
      'https://api-new.honeycomb.io/',
      '--transport',
      'grpc',
    ])
    expectOutput(stderr, heredoc(`
      Updating telemetry drain ${appTelemetryDrain1.id}... done
    `))
    expectOutput(stdout, heredoc(`
      === ${updatedAppTelemetryDrain.id}
      App:       ⬢ myapp
      Signals:   ${updatedAppTelemetryDrain.signals.join(', ')}
      Endpoint:  ${updatedAppTelemetryDrain.exporter.endpoint}
      Transport: gRPC
      Headers:   {"x-honeycomb-dataset":"your-dataset","x-honeycomb-team":"your-api-key"}
    `))
  })

  it('requires an updated attribute to be provided', async function () {
    const errorMessage = 'Requires either --signals, --endpoint, --transport or HEADERS to be provided.'
    const {error} = await runCommand(Cmd, [appTelemetryDrain1.id])
    expect(error?.message).to.contain(errorMessage)
  })
})
