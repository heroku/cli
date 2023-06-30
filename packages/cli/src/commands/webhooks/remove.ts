import {flags} from '@heroku-cli/command'
import Spinner from '@oclif/core/lib/cli-ux/action/spinner'

import BaseCommand from 'src/lib/webhooks/base'
export default class WebhooksRemove extends BaseCommand {
  static description = 'removes a webhook from an app'

  static examples = [
    '$ heroku webhooks:remove 99999999-9999-9999-9999-999999999999',
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
  }

  static args = [
    {name: 'id', description: 'id of webhook to remove', required: true},
  ]

  async run() {
    const {flags, args} = await this.parse(WebhooksRemove)
    const {path, display} = this.webhookType(flags)
    const action = new Spinner()

    action.start(`Removing webhook ${args.id} from ${display}`)

    await this.webhooksClient.delete(`${path}/webhooks/${args.id}`)

    action.stop()
  }
}
