import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/telemetry/add'
import runCommand from '../../../helpers/runCommand'
import * as chai from 'chai'
import * as chaiNock from 'chai-nock'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput'
import heredoc from 'tsheredoc'
import {TelemetryDrains} from '../../../../src/lib/types/telemetry'
import {addAllDrainsConfig} from '../../../fixtures/telemetry/fixtures'

chai.use(chaiNock)
const expect = chai.expect

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

  it('returns an error if an app, remote, or space is not set', async function () {
    try {
      await runCommand(Cmd)
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Exactly one of the following must be provided: --app, --remote, --space')
    }
  })

  it('returns an error if values are provided for both the app and the space flags', async function () {
    try {
      await runCommand(Cmd, [
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

  it('correctly assembles telemetry configuration when all flags are correctly set', async function () {
    const telemetryNock = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .post(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)

    await runCommand(Cmd, [
      '--space',
      spaceId,
      '--endpoint',
      'https://api.testendpoint.com',
      '--transport',
      'http',
    ])

    expect(telemetryNock).to.have.been.requestedWith(addAllDrainsConfig)
  })

  it('sets ["logs", "metrics", "traces"] as the default value for the --signal flag', async function () {
    const telemetryNock = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .put(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)

    await runCommand(Cmd, [
      '--space',
      spaceId,
      '--endpoint',
      'https://api.testendpoint.com',
      '--transport',
      'http',
    ])

    expect(telemetryNock).to.have.been.requestedWith(addAllDrainsConfig)
  })
  it('does not accept options other than logs, metrics, traces, or all for the --signal flag', async function () {
    const telemetryNock = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .put(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)

    await runCommand(Cmd, [
      '--space',
      spaceId,
      '--signal',
      'all',
      '--endpoint',
      'https://api.testendpoint.com',
      '--transport',
      'http',
    ])

    expect(telemetryNock).to.have.been.requestedWith(addAllDrainsConfig)
  })

  it('sets the signals to logs, metrics, and traces if "all" is specified for the --signal flag', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .put(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)

    try {
      await runCommand(Cmd, [
        '--space',
        spaceId,
        '--signal',
        'logs,foo',
        '--endpoint',
        'https://api.testendpoint.com',
        '--transport',
        'http',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Invalid signal option: foo. Signals must include some combination of "traces", "metrics", or "logs". The option "all" can be used on its own to include all three.')
    }
  })

  it('returns an error when the --signal flag is set to "all" in combination with other options', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      .put(`/spaces/${spaceId}/telemetry-drains`)
      .reply(200, spaceTelemetryDrains)

    try {
      await runCommand(Cmd, [
        '--space',
        spaceId,
        '--signal',
        'logs,all',
        '--endpoint',
        'https://api.testendpoint.com',
        '--transport',
        'http',
      ])
    } catch (error) {
      const {message} = error as { message: string }
      expect(message).to.contain('Invalid signal option: all. Signals must include some combination of "traces", "metrics", or "logs". The option "all" can be used on its own to include all three.')
    }
  })
})
