import {Command, flags as Flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {TelemetryDrains} from '../../lib/types/telemetry'

export default class Index extends Command {
  static topic = 'telemetry'
  static description = 'list telemetry drains'
  static flags = {
    space: Flags.string({char: 's', description: 'filter by space name', exactlyOne: ['app', 'space']}),
    app: Flags.app({description: 'filter by app name'}),
  };

  static example = '$ heroku telemetry'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {app, space} = flags

    if (app) {
      const {body: appTelemetryDrains} =  await this.heroku.get<TelemetryDrains>(`/apps/${app}/telemetry-drains`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })
      this.display(appTelemetryDrains, 'App')
    } else if (space) {
      const {body: spaceTelemetryDrains} =  await this.heroku.get<TelemetryDrains>(`/spaces/${space}/telemetry-drains`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })
      this.display(spaceTelemetryDrains, 'Space')
    }
  }

  protected display(telemetryDrains: TelemetryDrains, ownerType: 'App' | 'Space') {
    ux.styledHeader(`${ownerType} Telemetry Drains`)
    ux.table(
      telemetryDrains,
      {
        ID: {get: telemetryDrain => telemetryDrain.id},
        Signals: {get: telemetryDrain => telemetryDrain.signals},
        Endpoint: {get: telemetryDrain => telemetryDrain.exporter.endpoint},
        [ownerType]: {get: telemetryDrain => telemetryDrain.owner.name},
      },
    )
  }
}
