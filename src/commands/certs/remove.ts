import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {sniEndpointExtensions} from '@heroku/sdk/extensions/platform'
import {SniEndpoint} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import {sniEndpointSelector, withSelectorFlagHint} from '../../lib/certs/flags.js'
import ConfirmCommand from '../../lib/confirm-command.js'
import {createSDK} from '../../lib/sdk.js'

const heredoc = tsheredoc

export default class Remove extends Command {
  static description = 'remove an SSL certificate from an app'
  static enableJsonFlag = true
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({description: 'set to app name to bypass confirm prompt'}),
    endpoint: flags.string({description: 'endpoint to remove', exclusive: ['name']}),
    name: flags.string({description: 'name to remove', exclusive: ['endpoint']}),
    remote: flags.remote(),
  }
  static topic = 'certs'

  public async run(): Promise<SniEndpoint> {
    const {platform} = createSDK(this.heroku, {extensions: [sniEndpointExtensions]})
    const {flags} = await this.parse(Remove)
    const {app, confirm} = flags
    let removing = false
    try {
      const deletedEndpoint = await platform.sniEndpoint.resolveAndDelete(app, sniEndpointSelector(flags), {
        beforeDelete: async ({sniEndpoint}) => {
          await new ConfirmCommand().confirm(
            app,
            confirm,
            heredoc`
              WARNING: Destructive Action - you cannot rollback this change
              This command will remove the endpoint ${sniEndpoint.name} from ${color.app(app)}.
            `,
            {json: this.jsonEnabled()},
          )
          ux.action.start(`Removing SSL certificate ${sniEndpoint.name} from ${color.app(app)}`)
          removing = true
        },
      })
      ux.action.stop()
      return deletedEndpoint
    } catch (error) {
      // Under --json, oclif's catch() leaves the spinner running and it swallows the error output.
      if (removing) ux.action.stop(color.failure('!'))
      throw withSelectorFlagHint(error)
    }
  }
}
