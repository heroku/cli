import {hux} from '@heroku/heroku-cli-util'
import {flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import BaseCommand from '../../../lib/webhooks/base.js'

export default class Info extends BaseCommand {
  static args = {
    id: Args.string({description: 'ID of the webhook event', required: true}),
  }

  static description = 'info for a webhook event on an app'

  static examples = [
    '$ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999',
  ]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(Info)
    const {path} = this.webhookType(flags)

    ux.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')

    const {body: webhookEvent}: {body: any} = await this.webhooksClient.get(`${path}/webhook-events/${args.id}`)

    const obj = {
      payload: JSON.stringify(webhookEvent.payload, null, 2),
    }

    hux.styledHeader(webhookEvent.id)
    hux.styledObject(obj)
  }
}
