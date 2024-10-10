import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/telemetry'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {TelemetryDrains} from '../../../../src/lib/types/telemetry'

describe('telemetry:index', function () {
  const appId = '87654321-5717-4562-b3fc-2c963f66afa6'
  const spaceId = '12345678-5717-4562-b3fc-2c963f66afa6'
  let appTelemetryDrains: TelemetryDrains
  let spaceTelemetryDrains: TelemetryDrains

  beforeEach(function () {
    spaceTelemetryDrains = [
      {
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
      },
    ]
    appTelemetryDrains = [
      {
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
      },
      {
        id: '55555f64-5717-4562-b3fc-2c963f66afa6',
        owner: {id: appId, type: 'app', name: 'myapp'},
        capabilities: ['logs'],
        exporter: {
          type: 'otlphttp',
          endpoint: 'https://api.papertrail.com/',
          headers: {
            'x-papertrail-team': 'your-api-key',
            'x-papertrail-dataset': 'your-dataset',
          },
        },
      },
    ]
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows space telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .get(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)

    await runCommand(Cmd, [
      '--space',
      spaceId,
    ])
    expectOutput(stdout.output, heredoc(`
      === Space Telemetry Drains
       Id                                   Signals                         Endpoint                  Space
       ──────────────────────────────────── ─────────────────────────────── ───────────────────────── ───────
       44444321-5717-4562-b3fc-2c963f66afa6 [ 'traces', 'metrics', 'logs' ] https://api.honeycomb.io/ myspace
    `))
  })

  it('shows app telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .get(`/apps/${appId}/telemetry-drains`)
      .reply(200, appTelemetryDrains)

    await runCommand(Cmd, [
      '--app',
      appId,
    ])
    expectOutput(stdout.output, heredoc(`
      === App Telemetry Drains
       Id                                   Signals                 Endpoint                    App
       ──────────────────────────────────── ─────────────────────── ─────────────────────────── ─────
       3fa85f64-5717-4562-b3fc-2c963f66afa6 [ 'traces', 'metrics' ] https://api.honeycomb.io/   myapp
       55555f64-5717-4562-b3fc-2c963f66afa6 [ 'logs' ]              https://api.papertrail.com/ myapp
    `))
  })
})
