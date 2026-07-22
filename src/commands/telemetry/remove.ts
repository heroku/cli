import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {telemetryDrainExtensions} from '@heroku/sdk/extensions/platform'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Remove extends Command {
  static args = {
    telemetry_drain_id: Args.string({description: 'ID of the drain to remove'}),
  }
  static description = 'remove a telemetry drain'
  static flags = {
    app: flags.app({description: 'name of the app to remove all drains from'}),
    space: flags.string({char: 's', description: 'name of the space to remove all drains from'}),
  }
  static topic = 'telemetry'

  public async run(): Promise<void> {
    const {platform} = new HerokuSDK({extensions: [telemetryDrainExtensions]})
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
      await platform.telemetryDrain.delete(telemetry_drain_id)
    } else if (app) {
      ux.action.start(`Removing all telemetry drains from app ${app}`)
      await platform.telemetryDrain.removeDrains({app})
    } else if (space) {
      ux.action.start(`Removing all telemetry drains from space ${space}`)
      await platform.telemetryDrain.removeDrains({space})
    }

    ux.action.stop()
  }
}
