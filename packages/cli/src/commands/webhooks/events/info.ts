import {flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/webhooks/base'

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

  static args = {
    id: Args.string({required: true, description: 'The ID of the webhook event on an app.'}),
  }

  async run() {
    const {flags, args} = await this.parse(Info)
    const {path} = this.webhookType(flags)

    ux.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')

    const {body: webhookEvent}: {body: any} = await this.webhooksClient.get(`${path}/webhook-events/${args.id}`)

    const obj = {
      payload: JSON.stringify(webhookEvent.payload, null, 2),
    }

    ux.styledHeader(webhookEvent.id)
    ux.styledObject(obj)
  }
}
