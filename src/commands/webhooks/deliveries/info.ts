import {flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {hux} from '@heroku/heroku-cli-util'
import {Args} from '@oclif/core'

import BaseCommand from '../../../lib/webhooks/base.js'

export default class DeliveriesInfo extends BaseCommand {
  static args = {
    id: Args.string({description: 'ID of the webhook event', required: true}),
  }

  static description = 'info for a webhook event on an app'

  static examples = [
    `${color.command('heroku webhooks:deliveries:info')} 99999999-9999-9999-9999-999999999999`,
  ]

  static flags = {
    app: flags.app(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true}),
    remote: flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(DeliveriesInfo)
    const {path} = this.webhookType(flags)

    const {body: delivery}: {body: any} = await this.webhooksClient.get(`${path}/webhook-deliveries/${args.id}`)

    const {body: event}: {body: any} = await this.webhooksClient.get(`${path}/webhook-events/${delivery.event.id}`)

    /* eslint-disable perfectionist/sort-objects */
    const obj = {
      Created: delivery.created_at,
      Event: delivery.event.id,
      Webhook: delivery.webhook.id,
      Status: delivery.status,
      Include: delivery.event.include,
      Level: delivery.webhook.level,
      Attempts: delivery.num_attempts,
      Code: delivery.last_attempt && delivery.last_attempt.code,
      Error: delivery.last_attempt && delivery.last_attempt.error_class,
      'Next Attempt': delivery.next_attempt_at,
    }
    /* eslint-enable perfectionist/sort-objects */

    hux.styledHeader(delivery.id)
    hux.styledObject(obj)

    hux.styledHeader('Event Payload')
    hux.styledJSON(event.payload)
  }
}
