import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import webhookType from '../../../webhook-type'

export default class DeliveriesInfo extends Command {
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

    const {body} = await this.heroku.get(`${path}/webhook-deliveries/${args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    const delivery = body

    const res = await this.heroku.get(`${path}/webhook-events/${delivery.event.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
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
