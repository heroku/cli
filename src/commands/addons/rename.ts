import {Command} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

export default class Rename extends Command {
  static args = {
    addon_name: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
    new_name: Args.string({description: 'new globally unique name of the add-on', required: true}),
  }
  static description = 'rename an add-on'
  static topic = 'addons'

  public async run(): Promise<void> {
    const {args} = await this.parse(Rename)
    const {platform} = new HerokuSDK()
    const addon = await platform.addOn.info(args.addon_name)
    await platform.addOn.update(addon.app!.id!, addon.id!, {name: args.new_name, plan: addon.plan!.name!})
    ux.stdout(`${color.addon(args.addon_name)} successfully renamed to ${color.info(args.new_name)}.`)
  }
}
