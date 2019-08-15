import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../base'

export default class WebhooksInfo extends BaseCommand {
  static description = 'info for a webhook on an app'

  static example = ['$ heroku webhooks:info 99999999-9999-9999-9999-999999999999']

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {flags, args} = this.parse(WebhooksInfo)
    const {path} = this.webhookType(flags)

    const {body} = await this.httpClient.get(`${path}/webhooks/${args.id}`)
    const webhook = body

    const obj = {
      'Webhook ID': webhook.id,
      URL: webhook.url,
      Include: webhook.include.join(','),
      Level: webhook.level
    }

    cli.styledHeader(webhook.id)
    cli.styledObject(obj)
  }
}
