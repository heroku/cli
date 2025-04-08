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
      owner: {id: spaceId, type: 'space'},
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
      owner: {id: appId, type: 'app'},
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

    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/spaces/${spaceTelemetryDrain.owner.id}`)
      .reply(200, {id: spaceTelemetryDrain.owner.id, name: 'myspace'})

    await runCommand(Cmd, [
      spaceTelemetryDrain.id,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${spaceTelemetryDrain.id}
      Space:     myspace
      Signals:   ${spaceTelemetryDrain.signals.join(', ')}
      Endpoint:  ${spaceTelemetryDrain.exporter.endpoint}
      Transport: HTTP
      Headers:   {"x-honeycomb-team":"your-api-key","x-honeycomb-dataset":"your-dataset"}
    `))
  })

  it('shows info for app telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/telemetry-drains/${appTelemetryDrain.id}`)
      .reply(200, appTelemetryDrain)

    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/apps/${appTelemetryDrain.owner.id}`)
      .reply(200, {id: appTelemetryDrain.owner.id, name: 'myapp'})

    await runCommand(Cmd, [
      appTelemetryDrain.id,
    ])
    expectOutput(stdout.output, heredoc(`
      === ${appTelemetryDrain.id}
      App:       myapp
      Signals:   ${appTelemetryDrain.signals.join(', ')}
      Endpoint:  ${appTelemetryDrain.exporter.endpoint}
      Transport: HTTP
      Headers:   {"x-honeycomb-team":"your-api-key","x-honeycomb-dataset":"your-dataset"}
    `))
  })
})
