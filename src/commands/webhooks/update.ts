import {flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../lib/webhooks/base.js'

export default class WebhooksUpdate extends BaseCommand {
  static args = {
    id: Args.string({description: 'ID of the webhook', required: true}),
  }
  static description = 'updates a webhook in an app'
  static examples = [
    `${color.command('heroku webhooks:update')} 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks`,
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
    const {args, flags} = await this.parse(WebhooksUpdate)
    const {display, path} = this.webhookType(flags)

    ux.action.start(`Updating webhook ${args.id} for ${display}`)

    await this.webhooksClient.patch(`${path}/webhooks/${args.id}`, {
      body: {
        include: flags.include && flags.include.split(',').map((s: string) => s.trim()),
        level: flags.level,
        secret: flags.secret,
        url: flags.url,
      },
    })

    ux.action.stop()
  }
}
