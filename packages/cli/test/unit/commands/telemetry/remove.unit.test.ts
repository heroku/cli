import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/telemetry/remove'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {expect} from 'chai'

import {TelemetryDrain, TelemetryDrains} from '../../../../src/lib/types/telemetry'

describe('telemetry:remove', function () {
  const appId = '87654321-5717-4562-b3fc-2c963f66afa6'
  const spaceId = '12345678-5717-4562-b3fc-2c963f66afa6'
  let appTelemetryDrain: TelemetryDrain
  let appTelemetryDrainTwo: TelemetryDrain
  let spaceTelemetryDrain: TelemetryDrain
  let appTelemetryDrains: TelemetryDrains
  let spaceTelemetryDrains: TelemetryDrains

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
    appTelemetryDrainTwo = {
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
    }
    appTelemetryDrains = [appTelemetryDrain, appTelemetryDrainTwo]
    spaceTelemetryDrains = [spaceTelemetryDrain]
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
      .reply(200, appTelemetryDrain)

    await runCommand(Cmd, [
      appTelemetryDrain.id,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing telemetry drain ${appTelemetryDrain.id}, which was configured for app ${appTelemetryDrain.owner.name}...
      Removing telemetry drain ${appTelemetryDrain.id}, which was configured for app ${appTelemetryDrain.owner.name}... done
    `))
  })

  it('deletes all drains from an app', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .get(`/apps/${appId}/telemetry-drains`)
      .reply(200, appTelemetryDrains)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .delete(`/telemetry-drains/${appTelemetryDrain.id}`)
      .reply(200, appTelemetryDrain)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .delete(`/telemetry-drains/${appTelemetryDrainTwo.id}`)
      .reply(200, appTelemetryDrainTwo)

    await runCommand(Cmd, [
      '--app', appId,
    ])
    expectOutput(stderr.output, heredoc(`
      Removing all telemetry drains from app ${appId}...
      Removing all telemetry drains from app ${appId}... done
    `))
  })

  it('deletes all drains from a space', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .get(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .delete(`/telemetry-drains/${spaceTelemetryDrain.id}`)
      .reply(200, spaceTelemetryDrain)

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
