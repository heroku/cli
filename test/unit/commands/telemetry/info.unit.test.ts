import type {TelemetryDrain} from '@heroku/types/3.sdk'

import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/telemetry/info.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  app: {info: SinonStub}
  space: {info: SinonStub}
  telemetryDrain: {info: SinonStub}
}

function buildFakePlatform(): FakePlatform {
  return {
    app: {info: stub()},
    space: {info: stub()},
    telemetryDrain: {info: stub()},
  }
}

describe('telemetry:info', function () {
  const appId = '87654321-5717-4562-b3fc-2c963f66afa6'
  const spaceId = '12345678-5717-4562-b3fc-2c963f66afa6'
  let appTelemetryDrain: TelemetryDrain
  let spaceTelemetryDrain: TelemetryDrain
  let fakePlatform: FakePlatform

  beforeEach(function () {
    spaceTelemetryDrain = {
      created_at: '2024-01-01T00:00:00Z',
      exporter: {
        endpoint: 'https://api.honeycomb.io/',
        headers: {
          'x-honeycomb-dataset': 'your-dataset',
          'x-honeycomb-team': 'your-api-key',
        },
        type: 'otlphttp',
      },
      id: '44444321-5717-4562-b3fc-2c963f66afa6',
      owner: {id: spaceId, type: 'space'},
      signals: ['traces', 'metrics', 'logs'],
      updated_at: '2024-01-01T00:00:00Z',
    }
    appTelemetryDrain = {
      created_at: '2024-01-01T00:00:00Z',
      exporter: {
        endpoint: 'https://api.honeycomb.io/',
        headers: {
          'x-honeycomb-dataset': 'your-dataset',
          'x-honeycomb-team': 'your-api-key',
        },
        type: 'otlphttp',
      },
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      owner: {id: appId, type: 'app'},
      signals: ['traces', 'metrics'],
      updated_at: '2024-01-01T00:00:00Z',
    }
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('shows info for space telemetry drain', async function () {
    fakePlatform.telemetryDrain.info.resolves(spaceTelemetryDrain)
    fakePlatform.space.info.resolves({id: spaceTelemetryDrain.owner.id, name: 'myspace'})

    const {stdout} = await runCommand(Cmd, [
      spaceTelemetryDrain.id,
    ])
    expectOutput(stdout, heredoc(`
      === ${spaceTelemetryDrain.id}
      Space:     ⬡ myspace
      Signals:   ${spaceTelemetryDrain.signals.join(', ')}
      Endpoint:  ${spaceTelemetryDrain.exporter.endpoint}
      Transport: HTTP
      Headers:   {"x-honeycomb-dataset":"your-dataset","x-honeycomb-team":"your-api-key"}
    `))
  })

  it('shows info for app telemetry drains', async function () {
    fakePlatform.telemetryDrain.info.resolves(appTelemetryDrain)
    fakePlatform.app.info.resolves({id: appTelemetryDrain.owner.id, name: 'myapp'})

    const {stdout} = await runCommand(Cmd, [
      appTelemetryDrain.id,
    ])
    expectOutput(stdout, heredoc(`
      === ${appTelemetryDrain.id}
      App:       ⬢ myapp
      Signals:   ${appTelemetryDrain.signals.join(', ')}
      Endpoint:  ${appTelemetryDrain.exporter.endpoint}
      Transport: HTTP
      Headers:   {"x-honeycomb-dataset":"your-dataset","x-honeycomb-team":"your-api-key"}
    `))
  })
})
