import {flags, Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {TelemetryDrain} from '../../lib/types/telemetry'
import heredoc from 'tsheredoc'

export default class Remove extends Command {
  static topic = 'telemetry'
  static description = 'remove a telemetry drain'
  static args = {
    telemetry_drain_id: Args.string({description: 'ID of the drain to remove'}),
  }

  static flags = {
    app: flags.app({description: 'name of the app to remove all drains from'}),
    space: flags.string({char: 's', description: 'name of the space to remove all drains from'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Remove)
    const {app, space} = flags
    const {telemetry_drain_id} = args
    if (!(app || space || telemetry_drain_id)) {
      ux.error(heredoc(`
        Requires either --app or --space or a TELEMETRY_DRAIN_ID to be provided.
        See more help with --help
      `))
    }

    if (telemetry_drain_id) {
      ux.action.start(`Removing telemetry drain ${telemetry_drain_id}`)
      await this.removeDrain(telemetry_drain_id)
    } else if (app) {
      ux.action.start(`Removing all telemetry drains from app ${app}`)
      const {body: telemetryDrains} = await this.heroku.get<TelemetryDrain[]>(`/apps/${app}/telemetry-drains`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })

      for (const telemetryDrain of telemetryDrains) {
        await this.removeDrain(telemetryDrain.id)
      }
    } else if (space) {
      ux.action.start(`Removing all telemetry drains from space ${space}`)
      const {body: telemetryDrains} = await this.heroku.get<TelemetryDrain[]>(`/spaces/${space}/telemetry-drains`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
        },
      })

      for (const telemetryDrain of telemetryDrains) {
        await this.removeDrain(telemetryDrain.id)
      }
    }

    ux.action.stop()
  }

  protected async removeDrain(telemetry_drain_id: string) {
    const {body: telemetryDrain} = await this.heroku.delete<TelemetryDrain>(`/telemetry-drains/${telemetry_drain_id}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    return telemetryDrain
  }
}
