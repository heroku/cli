import {flags} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import BaseCommand from '../../../base'

export default class DeliveriesInfo extends BaseCommand {
  static description = 'info for a webhook event on an app'

  static examples = [
    '$ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999',
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
    const {flags, args} = await this.parse(DeliveriesInfo)
    const {path} = this.webhookType(flags)

    const {body: delivery}: {body: any} = await this.webhooksClient.get(`${path}/webhook-deliveries/${args.id}`)

    const {body: event}: {body: any} = await this.webhooksClient.get(`${path}/webhook-events/${delivery.event.id}`)

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

    CliUx.ux.styledHeader(delivery.id)
    CliUx.ux.styledObject(obj)

    CliUx.ux.styledHeader('Event Payload')
    CliUx.ux.styledJSON(event.payload)
  }
}
