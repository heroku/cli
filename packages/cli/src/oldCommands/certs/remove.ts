import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import getEndpoint from '../../lib/certs/flags.js'
import ConfirmCommand from '../../lib/confirmCommand.js'
import tsheredoc from 'tsheredoc'
const heredoc = tsheredoc.default

/*
export default class Remove extends Command {
  static topic = 'certs'
  static description = 'remove an SSL certificate from an app'
  static flags = {
    confirm: flags.string({hidden: true}),
    name: flags.string({description: 'name to remove'}),
    endpoint: flags.string({description: 'endpoint to remove'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Remove)
    const {app, confirm} = flags
    const sniEndpoint = await getEndpoint(flags, this.heroku)
    await new ConfirmCommand().confirm(
      app,
      confirm,
      heredoc`
        WARNING: Destructive Action - you cannot rollback this change
        This command will remove the endpoint ${sniEndpoint.name} from ${color.app(app)}.
      `,
    )
    ux.action.start(`Removing SSL certificate ${sniEndpoint.name} from ${color.app(app)}`)
    await this.heroku.request(
      `/apps/${app}/sni-endpoints/${sniEndpoint.name}`,
      {method: 'DELETE'},
    )
    ux.action.stop()
  }
}
*/
