import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../../base'

export default class WebhooksAdd extends BaseCommand {
  static description = 'add a webhook to an app'

  static examples = [
    '$ heroku webhooks:add -i api:dyno -l notify -u https://example.com/hooks',
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
    include: flags.string({char: 'i', description: 'comma delimited event types your server will receive ', required: true}),
    level: flags.string({char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', required: true}),
    secret: flags.string({char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header'}),
    authorization: flags.string({char: 't', description: 'authoriation header to send with webhooks'}),
    url: flags.string({char: 'u', description: 'URL for receiver', required: true}),
  }

  async run() {
    const {flags} = this.parse(WebhooksAdd)
    const {path, display} = this.webhookType(flags)

    cli.action.start(`Adding webhook to ${display}`)

    const response = await this.webhooksClient.post(`${path}/webhooks`, {
      body: {
        include: flags.include.split(',').map(s => s.trim()),
        level: flags.level,
        secret: flags.secret,
        url: flags.url,
        authorization: flags.authorization,
      },
    })

    const secret = response.headers && response.headers['heroku-webhook-secret'] as string

    cli.action.stop()

    if (secret) {
      cli.styledHeader('Webhooks Signing Secret')
      this.log(secret)
    } else {
      cli.warn('no secret found')
    }
  }
}
