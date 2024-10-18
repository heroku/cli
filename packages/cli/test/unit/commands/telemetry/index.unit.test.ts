import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/telemetry'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {TelemetryDrains} from '../../../../src/lib/types/telemetry'
import {spaceTelemetryDrain1, appTelemetryDrain1, appTelemetryDrain2} from '../../../fixtures/telemetry/fixtures'

describe('telemetry:index', function () {
  let appId: string
  let spaceId: string
  let appTelemetryDrains: TelemetryDrains
  let spaceTelemetryDrains: TelemetryDrains

  beforeEach(function () {
    appId = appTelemetryDrain1.owner.id
    spaceId = spaceTelemetryDrain1.owner.id
    spaceTelemetryDrains = [spaceTelemetryDrain1]
    appTelemetryDrains = [appTelemetryDrain1, appTelemetryDrain2]
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  it('shows space telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
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
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
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
