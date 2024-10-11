import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/telemetry/remove'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {TelemetryDrain} from '../../../../src/lib/types/telemetry'

describe('telemetry:remove', function () {
  const appId = '87654321-5717-4562-b3fc-2c963f66afa6'
  const spaceId = '12345678-5717-4562-b3fc-2c963f66afa6'
  let appTelemetryDrain: TelemetryDrain
  let spaceTelemetryDrain: TelemetryDrain

  beforeEach(function () {
    spaceTelemetryDrain = {
      id: '44444321-5717-4562-b3fc-2c963f66afa6',
      owner: {id: spaceId, type: 'space', name: 'myspace'},
      capabilities: ['traces', 'metrics', 'logs'],
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
      capabilities: ['traces', 'metrics'],
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

  it('deletes a space telemetry drain', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .get(`/telemetry-drains/${spaceTelemetryDrain.id}`)
      .reply(200, spaceTelemetryDrain)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .delete(`/telemetry-drains/${spaceTelemetryDrain.id}`)
      .reply(200, spaceTelemetryDrain)

    await runCommand(Cmd, [
      spaceTelemetryDrain.id,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing telemetry drain ${spaceTelemetryDrain.id}, which was configured for space ${spaceTelemetryDrain.owner.name}...
      Removing telemetry drain ${spaceTelemetryDrain.id}, which was configured for space ${spaceTelemetryDrain.owner.name}... done
    `))
  })

  it('deletes an app telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .get(`/telemetry-drains/${appTelemetryDrain.id}`)
      .reply(200, appTelemetryDrain)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .delete(`/telemetry-drains/${appTelemetryDrain.id}`)
      .reply(200, spaceTelemetryDrain)

    await runCommand(Cmd, [
      appTelemetryDrain.id,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing telemetry drain ${appTelemetryDrain.id}, which was configured for app ${appTelemetryDrain.owner.name}...
      Removing telemetry drain ${appTelemetryDrain.id}, which was configured for app ${appTelemetryDrain.owner.name}... done
    `))
  })
})
