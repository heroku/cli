import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../webhook-type'
import BaseCommand from '../base'
export default class WebhooksRemove extends BaseCommand {
  static description = 'removes a webhook from an app'

  static examples = [
    '$ heroku webhooks:remove 99999999-9999-9999-9999-999999999999'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  static args = [
    {name: 'id', description: 'id of webhook to remove', required: true}
  ]

  async run() {
    const {flags, args} = this.parse(WebhooksRemove)
    const {path, display} = webhookType(flags)

    cli.action.start(`Removing webhook ${args.id} from ${display}`)

    await this.httpClient.delete(`${path}/webhooks/${args.id}`)

    cli.action.stop()
  }
}
