import {stderr, stdout} from 'stdout-stderr'
import Cmd from '../../../../src/commands/telemetry/update'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {expect} from 'chai'
import {appTelemetryDrain1} from '../../../fixtures/telemetry/fixtures'

describe('telemetry:update', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('updates a telemetry drain with one field', async function () {
    const updatedAppTelemetryDrain = {...appTelemetryDrain1, signals: ['logs']}
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .patch(`/telemetry-drains/${appTelemetryDrain1.id}`, {signals: ['logs']})
      .reply(200, updatedAppTelemetryDrain)

    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/apps/${appTelemetryDrain1.owner.id}`)
      .reply(200, {id: appTelemetryDrain1.owner.id, name: 'myapp'})

    await runCommand(Cmd, [
      appTelemetryDrain1.id,
      '--signals',
      'logs',
    ])
    expectOutput(stderr.output, heredoc(`
      Updating telemetry drain ${appTelemetryDrain1.id}...
      Updating telemetry drain ${appTelemetryDrain1.id}... done
    `))
    expectOutput(stdout.output, heredoc(`
      === ${updatedAppTelemetryDrain.id}
      App:       myapp
      Signals:   ${updatedAppTelemetryDrain.signals.join(', ')}
      Endpoint:  ${updatedAppTelemetryDrain.exporter.endpoint}
      Transport: HTTP
      Headers:   {"x-honeycomb-team":"your-api-key","x-honeycomb-dataset":"your-dataset"}
    `))
  })

  it('updates a telemetry drain with multiple fields', async function () {
    const updatedAppTelemetryDrain = {
      ...appTelemetryDrain1,
      signals: ['logs'],
      exporter: {
        endpoint: 'https://api-new.honeycomb.io/',
        type: 'otlp',
        headers: {
          'x-honeycomb-team': 'your-api-key',
          'x-honeycomb-dataset': 'your-dataset',
        },
      },
    }
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .patch(`/telemetry-drains/${appTelemetryDrain1.id}`, {
        signals: ['logs'],
        exporter: {
          endpoint: 'https://api-new.honeycomb.io/',
          type: 'otlp',
        },
      })
      .reply(200, updatedAppTelemetryDrain)

    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get(`/apps/${appTelemetryDrain1.owner.id}`)
      .reply(200, {id: appTelemetryDrain1.owner.id, name: 'myapp'})

    await runCommand(Cmd, [
      appTelemetryDrain1.id,
      '--signals',
      'logs',
      '--endpoint',
      'https://api-new.honeycomb.io/',
      '--transport',
      'grpc',
    ])
    expectOutput(stderr.output, heredoc(`
      Updating telemetry drain ${appTelemetryDrain1.id}...
      Updating telemetry drain ${appTelemetryDrain1.id}... done
    `))
    expectOutput(stdout.output, heredoc(`
      === ${updatedAppTelemetryDrain.id}
      App:       myapp
      Signals:   ${updatedAppTelemetryDrain.signals.join(', ')}
      Endpoint:  ${updatedAppTelemetryDrain.exporter.endpoint}
      Transport: gRPC
      Headers:   {"x-honeycomb-team":"your-api-key","x-honeycomb-dataset":"your-dataset"}
    `))
  })

  it('requires an updated attribute to be provided', async function () {
    const errorMessage = 'Requires either --signals, --endpoint, --transport or HEADERS to be provided.'
    await runCommand(Cmd, [appTelemetryDrain1.id]).catch(error => {
      expect(error.message).to.contain(errorMessage)
    })
  })
})
