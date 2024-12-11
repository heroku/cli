import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/telemetry/add'
import runCommand from '../../../helpers/runCommand'
import {expect} from 'chai'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import {spaceTelemetryDrain1, appTelemetryDrain1} from '../../../fixtures/telemetry/fixtures'
import {firApp} from '../../../fixtures/apps/fixtures'
import * as spaceFixtures from '../../../fixtures/spaces/fixtures'
import {SpaceWithOutboundIps} from '../../../../src/lib/types/spaces'

const appId = appTelemetryDrain1.owner.id
const spaceId = spaceTelemetryDrain1.owner.id
const testEndpoint = appTelemetryDrain1.exporter.endpoint

describe('telemetry:add', function () {
  let space: SpaceWithOutboundIps

  beforeEach(function () {
    space = spaceFixtures.spaces['non-shield-space']
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  it('returns an error if an app, remote, or space is not set', async function () {
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--headers',
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Exactly one of the following must be provided: --app, --space')
    }
  })

  it('returns an error if values are provided for both the app and the space flags', async function () {
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--app',
        firApp.name || '',
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
      .get(`/apps/${appId}`)
      .reply(200, firApp)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/telemetry-drains')
      .reply(200, spaceTelemetryDrain1)

    await runCommand(Cmd, [
      testEndpoint,
      '--headers',
      '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      '--app',
      appId,
      '--signals',
      'logs',
    ])

    expectOutput(stdout.output, `successfully added drain ${testEndpoint}`)
  })

  it('successfully creates a telemetry drain for a space', async function () {
    nock('https://api.heroku.com')
      .get(`/spaces/${spaceId}`)
      .reply(200, space)
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/telemetry-drains')
      .reply(200, spaceTelemetryDrain1)

    await runCommand(Cmd, [
      testEndpoint,
      '--headers',
      '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
      '--space',
      spaceId,
      '--signals',
      'logs',
    ])

    expectOutput(stdout.output, `successfully added drain ${testEndpoint}`)
  })

  it('does not accept options other than logs, metrics, traces, or all for the --signal flag', async function () {
    nock('https://api.heroku.com')
      .get(`/spaces/${spaceId}`)
      .reply(200, space)
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--headers',
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
        '--space',
        spaceId,
        '--signals',
        'logs,foo',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Invalid signal option: logs,foo. Run heroku telemetry:add --help to see signal options.')
    }
  })

  it('returns an error when the --signal flag is set to "all" in combination with other options', async function () {
    nock('https://api.heroku.com')
      .get(`/spaces/${spaceId}`)
      .reply(200, space)
    try {
      await runCommand(Cmd, [
        testEndpoint,
        '--headers',
        '{"x-honeycomb-team": "your-api-key", "x-honeycomb-dataset": "your-dataset"}',
        '--space',
        spaceId,
        '--signals',
        'logs,all',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Invalid signal option: logs,all. Run heroku telemetry:add --help to see signal options.')
    }
  })
})
