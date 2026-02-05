import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import getEndpoint from '../../lib/certs/flags.js'
import ConfirmCommand from '../../lib/confirmCommand.js'

const heredoc = tsheredoc.default

export default class Remove extends Command {
  static description = 'remove an SSL certificate from an app'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({hidden: true}),
    endpoint: flags.string({description: 'endpoint to remove'}),
    name: flags.string({description: 'name to remove'}),
    remote: flags.remote(),
  }

  static topic = 'certs'

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
