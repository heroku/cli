import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../webhook-type'

export default class WebhooksUpdate extends Command {
  static description = 'updates a webhook in an app'

  static examples = [
    '$ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true}),
    include: flags.string({char: 'i', description: 'comma delimited event types your server will receive ', required: true}),
    level: flags.string({char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', required: true}),
    secret: flags.string({char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header'}),
    authorization: flags.string({char: 't', description: 'authoriation header to send with webhooks'}),
    url: flags.string({char: 'u', description: 'URL for receiver', required: true})
  }

  static args = [
    {name: 'id'}
  ]

  async run() {
    const {flags, args} = this.parse(WebhooksUpdate)
    let {path, display} = webhookType(flags)

    cli.action.start(`Updating webhook ${args.id} for ${display}`)

    await this.heroku.patch(`${path}/webhooks/${args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
      body: {
        include: flags.include && flags.include.split(',').map(s => s.trim()),
        level: flags.level,
        secret: flags.secret,
        url: flags.url
      }
    })

    cli.action.stop()
  }
}
