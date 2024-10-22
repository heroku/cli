import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Rename extends Command {
  static topic = 'addons';
  static description = 'rename an add-on';

  static args = {
    addon_name: Args.string({required: true, description: 'unique identifier or globally unique name of the add-on'}),
    new_name: Args.string({required: true, description: 'new globally unique name of the add-on'}),
  };

  public async run(): Promise<void> {
    const {args} = await this.parse(Rename)
    const {body: addon} = await this.heroku.get<Heroku.AddOn>(`/addons/${encodeURIComponent(args.addon_name)}`)
    await this.heroku.patch<Heroku.AddOn>(`/apps/${addon.app?.id}/addons/${addon.id}`, {body: {name: args.new_name}})
    ux.log(`${args.addon_name} successfully renamed to ${args.new_name}.`)
  }
}
