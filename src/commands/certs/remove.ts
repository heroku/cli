import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {SniEndpoint} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import getEndpoint from '../../lib/certs/flags.js'
import ConfirmCommand from '../../lib/confirm-command.js'

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

  public async run(): Promise<SniEndpoint> {
    const {platform} = new HerokuSDK()
    const {flags} = await this.parse(Remove)
    const {app, confirm} = flags
    const sniEndpoint = await getEndpoint(flags, platform)
    await new ConfirmCommand().confirm(
      app,
      confirm,
      heredoc`
        WARNING: Destructive Action - you cannot rollback this change
        This command will remove the endpoint ${sniEndpoint.name} from ${color.app(app)}.
      `,
    )
    ux.action.start(`Removing SSL certificate ${sniEndpoint.name} from ${color.app(app)}`)
    const deletedEndpoint = await platform.sniEndpoint.delete(app, sniEndpoint.name)
    ux.action.stop()

    return deletedEndpoint
  }
}
