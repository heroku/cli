import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/telemetry/info'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {TelemetryDrain} from '../../../../src/lib/types/telemetry'

describe('telemetry:info', function () {
  const appId = '87654321-5717-4562-b3fc-2c963f66afa6'
  const spaceId = '12345678-5717-4562-b3fc-2c963f66afa6'
  let appTelemetryDrain: TelemetryDrain
  let spaceTelemetryDrain: TelemetryDrain

  beforeEach(function () {
    spaceTelemetryDrain = {
      id: '44444321-5717-4562-b3fc-2c963f66afa6',
      owner: {id: spaceId, type: 'space', name: 'myspace'},
      signals: ['traces', 'metrics', 'logs'],
      exporter: {
        type: 'otlphttp',
        endpoint: 'https://api.honeycomb.io/',
        headers: {
          'x-honeycomb-team': 'your-api-key',
          'x-honeycomb-dataset': 'your-dataset',
        },
      },
    }
    appTelemetryDrain = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      owner: {id: appId, type: 'app', name: 'myapp'},
      signals: ['traces', 'metrics'],
      exporter: {
        type: 'otlphttp',
        endpoint: 'https://api.honeycomb.io/',
        headers: {
          'x-honeycomb-team': 'your-api-key',
          'x-honeycomb-dataset': 'your-dataset',
        },
      },
    }
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows info for space telemetry drain', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/telemetry-drains/${spaceTelemetryDrain.id}`)
      .reply(200, spaceTelemetryDrain)

    await runCommand(Cmd, [
      spaceTelemetryDrain.id,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${spaceTelemetryDrain.id}
      Space:    ${spaceTelemetryDrain.owner.name}
      Signals:  ${spaceTelemetryDrain.signals.join(', ')}
      Endpoint: ${spaceTelemetryDrain.exporter.endpoint}
      Kind:     ${spaceTelemetryDrain.exporter.type}
      Headers:  x-honeycomb-team: 'your-api-key', x-honeycomb-dataset: 'your-dataset'
    `))
  })

  it('shows info for app telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/telemetry-drains/${appTelemetryDrain.id}`)
      .reply(200, appTelemetryDrain)

    await runCommand(Cmd, [
      appTelemetryDrain.id,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${appTelemetryDrain.id}
      App:      ${appTelemetryDrain.owner.name}
      Signals:  ${appTelemetryDrain.signals.join(', ')}
      Endpoint: ${appTelemetryDrain.exporter.endpoint}
      Kind:     ${appTelemetryDrain.exporter.type}
      Headers:  x-honeycomb-team: 'your-api-key', x-honeycomb-dataset: 'your-dataset'
    `))
  })
})
