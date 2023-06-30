import {flags} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import BaseCommand from 'src/lib/webhooks/base'

export default class Info extends BaseCommand {
  static description = 'info for a webhook event on an app'

  static examples = [
    '$ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999',
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
  }

  static args = [
    {name: 'id', required: true},
  ]

  async run() {
    const {flags, args} = await this.parse(Info)
    const {path} = this.webhookType(flags)

    CliUx.ux.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')

    const {body: webhookEvent}: {body: any} = await this.webhooksClient.get(`${path}/webhook-events/${args.id}`)

    const obj = {
      payload: JSON.stringify(webhookEvent.payload, null, 2),
    }

    CliUx.ux.styledHeader(webhookEvent.id)
    CliUx.ux.styledObject(obj)
  }
}
