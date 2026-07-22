import type {TelemetryDrain} from '@heroku/types/3.sdk'

import {Command, flags as Flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

export default class Index extends Command {
  static description = 'list telemetry drains'
  static example = `${color.command('heroku telemetry')}`
  static flags = {
    app: Flags.string({char: 'a', description: 'filter by app name'}),
    space: Flags.string({char: 's', description: 'filter by space name', exactlyOne: ['app', 'space']}),
  }
  static topic = 'telemetry'

  protected display(telemetryDrains: TelemetryDrain[], owner: string | undefined) {
    if (telemetryDrains.length === 0) {
      ux.stdout(`There are no telemetry drains in ${owner}`)
    } else {
      hux.styledHeader(`${owner} Telemetry Drains`)
      /* eslint-disable perfectionist/sort-objects */
      hux.table(
        telemetryDrains,
        {
          ID: {get: (telemetryDrain: any) => telemetryDrain.id},
          Signals: {get: (telemetryDrain: any) => telemetryDrain.signals},
          Endpoint: {get: (telemetryDrain: any) => telemetryDrain.exporter.endpoint},
        },
      )
      /* eslint-enable perfectionist/sort-objects */
    }
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {app, space} = flags
    const {platform} = new HerokuSDK()
    let drains: TelemetryDrain[] = []
    if (app) {
      drains = await platform.telemetryDrain.listByApp(app)
    } else if (space) {
      drains = await platform.telemetryDrain.listBySpace(space)
    }

    this.display(drains, app || space)
  }
}
