import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../../webhook-type'
import BaseCommand from '../../base'

export default class DeliveriesInfo extends BaseCommand {
  static description = 'info for a webhook event on an app'

  static examples = [
    '$ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999'
  ]

  static flags = {
    app: flags.app(),
    remote: flags.remote(),
    pipeline: flags.pipeline({char: 'p', description: 'pipeline on which to list', hidden: true})
  }

  static args = [
    {name: 'id', required: true}
  ]

  async run() {
    const {flags, args} = this.parse(DeliveriesInfo)
    const {path} = webhookType(flags)

    const {body} = await this.httpClient.get(`${path}/webhook-deliveries/${args.id}`)
    const delivery = body

    const res = await this.httpClient.get(`${path}/webhook-events/${delivery.event.id}`)
    const event: any = res.body

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
      'Next Attempt': delivery.next_attempt_at
    }

    cli.styledHeader(delivery.id)
    cli.styledObject(obj)

    cli.styledHeader('Event Payload')
    cli.styledJSON(event.payload)
  }
}
