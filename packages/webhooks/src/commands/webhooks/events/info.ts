import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../../base'

export default class Info extends BaseCommand {
  static description = 'info for a webhook event on an app'

  static examples = [
    '$ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  static args = [
    {name: 'id', required: true}
  ]

  async run() {
    const {flags, args} = this.parse(Info)
    const {path} = this.webhookType(flags)

    cli.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')

    const {body: webhookEvent} = await this.webhooksClient.get(`${path}/webhook-events/${args.id}`)

    const obj = {
      payload: JSON.stringify(webhookEvent.payload, null, 2)
    }

    cli.styledHeader(webhookEvent.id)
    cli.styledObject(obj)
  }
}
