import {flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'

import BaseCommand from '../../lib/webhooks/base.js'

export default class WebhooksAdd extends BaseCommand {
  static description = 'add a webhook to an app'
  static examples = [
    `${color.command('heroku webhooks:add')} -i api:dyno -l notify -u https://example.com/hooks`,
  ]
  static flags = {
    app: flags.app(),
    authorization: flags.string({char: 't', description: 'authorization header to send with webhooks'}),
    include: flags.string({char: 'i', description: 'comma delimited event types your server will receive ', required: true}),
    level: flags.string({char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', required: true}),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
    remote: flags.remote(),
    secret: flags.string({char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header'}),
    url: flags.string({char: 'u', description: 'URL for receiver', required: true}),
  }

  async run() {
    const {flags} = await this.parse(WebhooksAdd)
    const {display, path} = this.webhookType(flags)

    ux.action.start(`Adding webhook to ${display}`)

    const response = await this.webhooksClient.post(`${path}/webhooks`, {
      body: {
        authorization: flags.authorization,
        include: flags.include.split(',').map((s: string) => s.trim()),
        level: flags.level,
        secret: flags.secret,
        url: flags.url,
      },
    })

    ux.action.stop()

    const secret = response.headers && response.headers['heroku-webhook-secret'] as string
    if (secret) {
      hux.styledHeader('Webhooks Signing Secret')
      ux.stdout(secret)
    } else {
      ux.warn('no secret found')
    }
  }
}
