import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/telemetry/remove'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {expect} from 'chai'
import {spaceTelemetryDrain1, appTelemetryDrain1, appTelemetryDrain2} from '../../../fixtures/telemetry/fixtures'
import {TelemetryDrains} from '../../../../src/lib/types/telemetry'

describe('telemetry:remove', function () {
  let appId: string
  let spaceId: string
  let appTelemetryDrains: TelemetryDrains
  let spaceTelemetryDrains: TelemetryDrains

  beforeEach(function () {
    appId = appTelemetryDrain1.owner.id
    spaceId = spaceTelemetryDrain1.owner.id
    appTelemetryDrains = [appTelemetryDrain1, appTelemetryDrain2]
    spaceTelemetryDrains = [spaceTelemetryDrain1]
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  it('deletes a space telemetry drain', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/telemetry-drains/${spaceTelemetryDrain1.id}`)
      .reply(200, spaceTelemetryDrain1)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .delete(`/telemetry-drains/${spaceTelemetryDrain1.id}`)
      .reply(200, spaceTelemetryDrain1)

    await runCommand(Cmd, [
      spaceTelemetryDrain1.id,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing telemetry drain ${spaceTelemetryDrain1.id}...
      Removing telemetry drain ${spaceTelemetryDrain1.id}... done
    `))
  })

  it('deletes an app telemetry drains', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/telemetry-drains/${appTelemetryDrain1.id}`)
      .reply(200, appTelemetryDrain1)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .delete(`/telemetry-drains/${appTelemetryDrain1.id}`)
      .reply(200, appTelemetryDrain1)

    await runCommand(Cmd, [
      appTelemetryDrain1.id,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing telemetry drain ${appTelemetryDrain1.id}...
      Removing telemetry drain ${appTelemetryDrain1.id}... done
    `))
  })

  it('deletes all drains from an app', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/apps/${appId}/telemetry-drains`)
      .reply(200, appTelemetryDrains)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .delete(`/telemetry-drains/${appTelemetryDrain1.id}`)
      .reply(200, appTelemetryDrain1)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .delete(`/telemetry-drains/${appTelemetryDrain2.id}`)
      .reply(200, appTelemetryDrain2)

    await runCommand(Cmd, [
      '--app', appId,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing all telemetry drains from app ${appId}...
      Removing all telemetry drains from app ${appId}... done
    `))
  })

  it('deletes all drains from a space', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .delete(`/telemetry-drains/${spaceTelemetryDrain1.id}`)
      .reply(200, spaceTelemetryDrain1)

    await runCommand(Cmd, [
      '--space', spaceId,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing all telemetry drains from space ${spaceId}...
      Removing all telemetry drains from space ${spaceId}... done
    `))
  })

  it('requires a telemetry id, an app id, or a space id', async function () {
    const errorMessage = 'Requires either --app or --space or a TELEMETRY_DRAIN_ID to be provided.'
    await runCommand(Cmd, []).catch(error => {
      expect(error.message).to.contain(errorMessage)
    })
  })
})
