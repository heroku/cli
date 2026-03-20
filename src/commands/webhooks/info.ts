import {flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'

import BaseCommand from '../../lib/webhooks/base.js'

export default class WebhooksInfo extends BaseCommand {
  static args = {
    id: Args.string({description: 'ID of the webhook', required: true}),
  }

  static description = 'info for a webhook on an app'

  static examples = [`${color.command('heroku webhooks:info')} 99999999-9999-9999-9999-999999999999`]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(WebhooksInfo)
    const {path} = this.webhookType(flags)

    const {body: webhook}: {body: any} = await this.webhooksClient.get(`${path}/webhooks/${args.id}`)

    /* eslint-disable perfectionist/sort-objects */
    const obj = {
      'Webhook ID': webhook.id,
      URL: webhook.url,
      Include: webhook.include.join(','),
      Level: webhook.level,
    }
    /* eslint-enable perfectionist/sort-objects */

    hux.styledHeader(webhook.id)
    hux.styledObject(obj)
  }
}
