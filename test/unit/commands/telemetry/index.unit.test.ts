import {stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/telemetry/index.js'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput.js'
import tsheredoc from 'tsheredoc'
import {TelemetryDrains} from '../../../../src/lib/types/telemetry.js'
import {spaceTelemetryDrain1, appTelemetryDrain1, appTelemetryDrain2} from '../../../fixtures/telemetry/fixtures.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'
import {expect} from 'chai'

const heredoc = tsheredoc.default

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
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace(`=== ${spaceId} Telemetry Drains`)
    const expectedTableHeader = removeAllWhitespace('ID                                   Signals                         Endpoint')
    const expected = removeAllWhitespace('44444321-5717-4562-b3fc-2c963f66afa6 traces, metrics, logs  https://api.honeycomb.io/')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedTableHeader)
    expect(actual).to.include(expected)
  })

  it('shows app telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/apps/${appId}/telemetry-drains`)
      .reply(200, appTelemetryDrains)

    await runCommand(Cmd, [
      '--app',
      appId,
    ])
    const actual = removeAllWhitespace(stdout.output)
    const expectedHeader = removeAllWhitespace(`=== ${appId} Telemetry Drains`)
    const expectedTableHeader = removeAllWhitespace('ID                                   Signals                 Endpoint')
    const expected = removeAllWhitespace(heredoc(`
      3fa85f64-5717-4562-b3fc-2c963f66afa6 traces, metrics   https://api.honeycomb.io/
      55555f64-5717-4562-b3fc-2c963f66afa6 logs              https://api.papertrail.com/
    `))
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedTableHeader)
    expect(actual).to.include(expected)
  })

  it('shows a message when there are no telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/apps/${appId}/telemetry-drains`)
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      appId,
    ])
    expectOutput(stdout.output, heredoc(`
      There are no telemetry drains in ${appId}
    `))
  })
})
