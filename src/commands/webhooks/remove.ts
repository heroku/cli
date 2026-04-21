import {flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../lib/webhooks/base.js'

export default class WebhooksRemove extends BaseCommand {
  static args = {
    id: Args.string({description: 'id of webhook to remove', required: true}),
  }
  static description = 'removes a webhook from an app'
  static examples = [
    `${color.command('heroku webhooks:remove')} 99999999-9999-9999-9999-999999999999`,
  ]
  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(WebhooksRemove)
    const {display, path} = this.webhookType(flags)

    ux.action.start(`Removing webhook ${args.id} from ${display}`)

    await this.webhooksClient.delete(`${path}/webhooks/${args.id}`)

    ux.action.stop()
  }
}
