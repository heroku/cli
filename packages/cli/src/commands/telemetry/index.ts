import {Command, flags as Flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {TelemetryDrains} from '../../lib/types/telemetry'

export default class Index extends Command {
  static topic = 'telemetry'
  static description = 'list telemetry drains'
  static flags = {
    space: Flags.string({char: 's', description: 'filter by space name', exactlyOne: ['app', 'space']}),
    app: Flags.string({char: 'a', description: 'filter by app name'}),
  };

  static example = '$ heroku telemetry'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {app, space} = flags
    let drains: TelemetryDrains = []
    if (app) {
      const {body: appTelemetryDrains} =  await this.heroku.get<TelemetryDrains>(`/apps/${app}/telemetry-drains`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })
      drains = appTelemetryDrains
    } else if (space) {
      const {body: spaceTelemetryDrains} =  await this.heroku.get<TelemetryDrains>(`/spaces/${space}/telemetry-drains`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })
      drains = spaceTelemetryDrains
    }

    this.display(drains, app || space)
  }

  protected display(telemetryDrains: TelemetryDrains, owner: string | undefined) {
    if (telemetryDrains.length === 0) {
      ux.log(`There are no telemetry drains in ${owner}`)
    } else {
      ux.styledHeader(`${owner} Telemetry Drains`)
      ux.table(
        telemetryDrains,
        {
          ID: {get: telemetryDrain => telemetryDrain.id},
          Signals: {get: telemetryDrain => telemetryDrain.signals},
          Endpoint: {get: telemetryDrain => telemetryDrain.exporter.endpoint},
        },
      )
    }
  }
}
