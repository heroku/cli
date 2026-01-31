import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
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
    const {body: addon} = await this.heroku.get<Heroku.AddOn>(`/addons/${encodeURIComponent(args.addon_name)}`)
    await this.heroku.patch<Heroku.AddOn>(`/apps/${addon.app?.id}/addons/${addon.id}`, {body: {name: args.new_name}})
    ux.stdout(`${color.addon(args.addon_name)} successfully renamed to ${color.info(args.new_name)}.`)
  }
}
