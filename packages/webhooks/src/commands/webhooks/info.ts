import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../webhook-type'

export default class WebhooksInfo extends Command {
  static description = 'info for a webhook on an app'

  static example = ['$ heroku webhooks:info 99999999-9999-9999-9999-999999999999']

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  static args = [{name: 'id'}]

  async run() {
    const {flags, args} = this.parse(WebhooksInfo)
    let {path} = webhookType(flags)

    let {body} = await this.heroku.get(`${path}/webhooks/${args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    let webhook = body

    let obj = {
      'Webhook ID': webhook.id,
      URL: webhook.url,
      Include: webhook.include.join(','),
      Level: webhook.level
    }

    cli.styledHeader(webhook.id)
    cli.styledObject(obj)
  }
}
