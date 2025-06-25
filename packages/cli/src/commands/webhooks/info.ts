/*
import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'

import BaseCommand from '../../lib/webhooks/base'

export default class WebhooksInfo extends BaseCommand {
  static description = 'info for a webhook on an app'

  static example = ['$ heroku webhooks:info 99999999-9999-9999-9999-999999999999']

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
  }

  static args = {
    id: Args.string({required: true, description: 'ID of the webhook'}),
  }

  async run() {
    const {flags, args} = await this.parse(WebhooksInfo)
    const {path} = this.webhookType(flags)

    const {body: webhook}: {body: any} = await this.webhooksClient.get(`${path}/webhooks/${args.id}`)

    const obj = {
      'Webhook ID': webhook.id,
      URL: webhook.url,
      Include: webhook.include.join(','),
      Level: webhook.level,
    }

    hux.styledHeader(webhook.id)
    hux.styledObject(obj)
  }
}
*/
