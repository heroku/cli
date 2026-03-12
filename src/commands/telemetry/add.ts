import {color} from '@heroku/heroku-cli-util'
import {Command, flags as Flags} from '@heroku-cli/command'
import {App, Space} from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {validateAndFormatSignals} from '../../lib/telemetry/util.js'
import {TelemetryDrain} from '../../lib/types/telemetry.js'

const heredoc = tsheredoc.default

export default class Add extends Command {
  static args = {
    endpoint: Args.string({description: 'drain url', required: true}),
  }

  static description = 'Add and configure a new telemetry drain. Defaults to collecting all telemetry unless otherwise specified.'

  /* eslint-disable quotes */
  static example = heredoc`
    Add a telemetry drain to an app to collect logs and traces:
    
    ${color.command(`heroku telemetry:add https://my-endpoint.com --app myapp --signals logs,traces --headers '{"x-drain-example-team": "API_KEY", "x-drain-example-dataset": "METRICS_DATASET"}'`)}
  `

  static flags = {
    app: Flags.string({char: 'a', description: 'app to add a drain to', exactlyOne: ['app', 'space']}),
    headers: Flags.string({description: 'custom headers to configure the drain in json format'}),
    signals: Flags.string({default: 'all', description: 'comma-delimited list of signals to collect (traces, metrics, logs). Use "all" to collect all signals.'}),
    space: Flags.string({char: 's', description: 'space to add a drain to'}),
    // If splunk transport is accepted as a feature, this should have options: ['http', 'grpc', 'splunk']
    transport: Flags.string({default: 'http', description: 'transport protocol for the drain'}),
  }
  /* eslint-enable quotes */

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)
    const {app, headers, signals, space, transport} = flags
    const {endpoint} = args

    // Allow splunk, but do not show splunk in error message until splunk transport is accepted as a feature
    // When splunk transport is accepted as a feature, and options are added for the transport flag, this section should be removed
    const publicTransports = ['http', 'grpc']
    const validTransports = [...publicTransports, 'splunk']
    if (!validTransports.includes(transport)) {
      throw new Error(`Expected --transport=${transport} to be one of: ${publicTransports.join(', ')}`)
    }

    let id
    if (app) {
      const {body: herokuApp} = await this.heroku.get<App>(
        `/apps/${app}`, {
          headers: {Accept: 'application/vnd.heroku+json; version=3.sdk'},
        })
      id = herokuApp.id
    } else {
      const {body: herokuSpace} = await this.heroku.get<Space>(`/spaces/${space}`)
      id = herokuSpace.id
    }

    const exporterHeaders = headers || '{}'
    const drainConfig = {
      exporter: {
        endpoint,
        headers: JSON.parse(exporterHeaders),
        type: this.getExporterType(transport),
      },
      owner: {
        id,
        type: app ? 'app' : 'space',
      },
      signals: validateAndFormatSignals(signals),
    }

    const {body: drain} = await this.heroku.post<TelemetryDrain>('/telemetry-drains', {
      body: drainConfig,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })

    ux.stdout(`successfully added drain ${drain.exporter.endpoint}`)
  }

  private getExporterType(transport: string): string {
    switch (transport) {
    case 'grpc': {
      return 'otlp'
    }

    case 'splunk': {
      return 'splunk'
    }

    default: {
      return 'otlphttp'
    }
    }
  }
}
