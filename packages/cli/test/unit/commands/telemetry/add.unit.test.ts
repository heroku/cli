import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/telemetry/add'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import {spaceTelemetryDrain1, appTelemetryDrain1} from '../../../fixtures/telemetry/fixtures'

const appId = appTelemetryDrain1.owner.id
const spaceId = spaceTelemetryDrain1.owner.id
const testEndpoint = appTelemetryDrain1.exporter.endpoint

describe('telemetry:index', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('returns an error if an app, remote, or space is not set', async function () {
    try {
      await runCommand(Cmd, [
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Exactly one of the following must be provided: --app, --remote, --space')
    }
  })

  it('returns an error if values are provided for both the app and the space flags', async function () {
    try {
      await runCommand(Cmd, [
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
        '--app',
        'myapp',
        '--space',
        'myspace',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('--space cannot also be provided when using --app')
    }
  })

  it('successfully creates a telemetry drain for an app', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post(`/apps/${appId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrain1)

    await runCommand(Cmd, [
      '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      '--app',
      appId,
      '--signal',
      'logs',
      '--endpoint',
      testEndpoint,
      '--transport',
      'http',
    ])

    expectOutput(stdout.output, `successfully added drain ${testEndpoint}`)
  })

  it('successfully creates a telemetry drain for a space', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrain1)

    await runCommand(Cmd, [
      '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      '--space',
      spaceId,
      '--signal',
      'logs',
      '--endpoint',
      testEndpoint,
      '--transport',
      'http',
    ])

    expectOutput(stdout.output, `successfully added drain ${testEndpoint}`)
  })

  it('does not accept options other than logs, metrics, traces, or all for the --signal flag', async function () {
    try {
      await runCommand(Cmd, [
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
        '--space',
        spaceId,
        '--signal',
        'logs,foo',
        '--endpoint',
        testEndpoint,
        '--transport',
        'http',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Invalid signal option: foo. Signals must include some combination of "traces", "metrics", or "logs". The option "all" can be used on its own to include all three.')
    }
  })

  it('returns an error when the --signal flag is set to "all" in combination with other options', async function () {
    try {
      await runCommand(Cmd, [
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
        '--space',
        spaceId,
        '--signal',
        'logs,all',
        '--endpoint',
        testEndpoint,
        '--transport',
        'http',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Invalid signal option: all. Signals must include some combination of "traces", "metrics", or "logs". The option "all" can be used on its own to include all three.')
    }
  })
})
