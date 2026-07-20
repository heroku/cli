import type {TelemetryDrain} from '@heroku/types/3.sdk'

import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/telemetry/index.js'
import {appTelemetryDrain1, appTelemetryDrain2, spaceTelemetryDrain1} from '../../../fixtures/telemetry/fixtures.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  telemetryDrain: {
    listByApp: SinonStub
    listBySpace: SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    telemetryDrain: {
      listByApp: stub(),
      listBySpace: stub(),
    },
  }
}

describe('telemetry:index', function () {
  let appId: string
  let spaceId: string
  let appTelemetryDrains: TelemetryDrain[]
  let spaceTelemetryDrains: TelemetryDrain[]
  let fakePlatform: FakePlatform

  beforeEach(function () {
    appId = appTelemetryDrain1.owner.id
    spaceId = spaceTelemetryDrain1.owner.id
    spaceTelemetryDrains = [spaceTelemetryDrain1]
    appTelemetryDrains = [appTelemetryDrain1, appTelemetryDrain2]
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('shows space telemetry drains', async function () {
    fakePlatform.telemetryDrain.listBySpace.resolves(spaceTelemetryDrains)

    const {stdout} = await runCommand(Cmd, [
      '--space',
      spaceId,
    ])
    const actual = removeAllWhitespace(stdout)
    const expectedHeader = removeAllWhitespace(`=== ${spaceId} Telemetry Drains`)
    const expectedTableHeader = removeAllWhitespace('ID                                   Signals                         Endpoint')
    const expected = removeAllWhitespace('44444321-5717-4562-b3fc-2c963f66afa6 traces, metrics, logs  https://api.honeycomb.io/')
    expect(actual).to.include(expectedHeader)
    expect(actual).to.include(expectedTableHeader)
    expect(actual).to.include(expected)
  })

  it('shows app telemetry drains', async function () {
    fakePlatform.telemetryDrain.listByApp.resolves(appTelemetryDrains)

    const {stdout} = await runCommand(Cmd, [
      '--app',
      appId,
    ])
    const actual = removeAllWhitespace(stdout)
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
    fakePlatform.telemetryDrain.listByApp.resolves([])

    const {stdout} = await runCommand(Cmd, [
      '--app',
      appId,
    ])
    expectOutput(stdout, heredoc(`
      There are no telemetry drains in ${appId}
    `))
  })
})
