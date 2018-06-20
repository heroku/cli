const {Command, flags} = require('@heroku-cli/command')
const cli = require('heroku-cli-util')
const webhookType = require('../../../lib/webhook-type.js')

class Info extends Command {
  async run () {
    const {flags, args} = this.parse(Info)
    let {path} = webhookType(flags)

    let {body} = await this.heroku.get(`${path}/webhook-deliveries/${args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    let delivery = body

    let res = await this.heroku.get(`${path}/webhook-events/${delivery.event.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    })
    let event = res.body

    let obj = {
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

Info.description = 'info for a webhook event on an app'

Info.examples = [
  '$ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999'
]

Info.args = [
  {name: 'id'}
]

Info.flags = {
  app: flags.app({char: 'a'}),
  pipeline: flags.string({char: 'p', description: 'pipeline on which to list', hidden: true})
}

module.exports = Info
