import type {TelemetryDrain} from '@heroku/types/3.sdk'

import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/telemetry/remove.js'
import {appTelemetryDrain1, appTelemetryDrain2, spaceTelemetryDrain1} from '../../../fixtures/telemetry/fixtures.js'

const heredoc = tsheredoc.default

type FakePlatform = {
  telemetryDrain: {
    delete: SinonStub
    removeDrains: SinonStub
  }
}

function buildFakePlatform(): FakePlatform {
  return {
    telemetryDrain: {
      delete: stub(),
      removeDrains: stub(),
    },
  }
}

describe('telemetry:remove', function () {
  let appId: string
  let spaceId: string
  let appTelemetryDrains: TelemetryDrain[]
  let spaceTelemetryDrains: TelemetryDrain[]
  let fakePlatform: FakePlatform

  beforeEach(function () {
    appId = appTelemetryDrain1.owner.id
    spaceId = spaceTelemetryDrain1.owner.id
    appTelemetryDrains = [appTelemetryDrain1, appTelemetryDrain2]
    spaceTelemetryDrains = [spaceTelemetryDrain1]
    fakePlatform = buildFakePlatform()
    stub(HerokuSDK.prototype, 'platform').get(() => fakePlatform)
  })

  afterEach(function () {
    restore()
  })

  it('deletes a space telemetry drain', async function () {
    fakePlatform.telemetryDrain.delete.resolves(spaceTelemetryDrain1)

    const {stderr} = await runCommand(Cmd, [
      spaceTelemetryDrain1.id,
    ])
    expectOutput(stderr, heredoc(`
      Removing telemetry drain ${spaceTelemetryDrain1.id}... done
    `))
  })

  it('deletes an app telemetry drains', async function () {
    fakePlatform.telemetryDrain.delete.resolves(appTelemetryDrain1)

    const {stderr} = await runCommand(Cmd, [
      appTelemetryDrain1.id,
    ])
    expectOutput(stderr, heredoc(`
      Removing telemetry drain ${appTelemetryDrain1.id}... done
    `))
  })

  it('deletes all drains from an app', async function () {
    fakePlatform.telemetryDrain.removeDrains.resolves([appTelemetryDrain1, appTelemetryDrain2])

    const {stderr} = await runCommand(Cmd, [
      '--app', appId,
    ])
    expectOutput(stderr, heredoc(`
      Removing all telemetry drains from app ${appId}... done
    `))
  })

  it('deletes all drains from a space', async function () {
    fakePlatform.telemetryDrain.removeDrains.resolves([spaceTelemetryDrain1])

    const {stderr} = await runCommand(Cmd, [
      '--space', spaceId,
    ])
    expectOutput(stderr, heredoc(`
      Removing all telemetry drains from space ${spaceId}... done
    `))
  })

  it('requires a telemetry id, an app id, or a space id', async function () {
    const errorMessage = 'Requires either --app or --space or a TELEMETRY_DRAIN_ID to be provided.'
    const {error} = await runCommand(Cmd, [])
    expect(error?.message).to.contain(errorMessage)
  })
})
