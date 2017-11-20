'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let webhookType = require('../../../lib/webhook_type.js')
  let {path} = webhookType(context)

  let delivery = yield heroku.get(`${path}/webhook-deliveries/${context.args.id}`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
  })

  let event = yield heroku.get(`${path}/webhook-events/${delivery.event.id}`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
  })

  let obj = {
    'Created': delivery.created_at,
    'Event': delivery.event.id,
    'Webhook': delivery.webhook.id,
    'Status': delivery.status,
    'Include': delivery.event.include,
    'Level': delivery.webhook.level,
    'Attempts': delivery.num_attempts,
    'Code': delivery.last_attempt && delivery.last_attempt.code,
    'Error': delivery.last_attempt && delivery.last_attempt.error_class,
    'Next Attempt': delivery.next_attempt_at
  }

  cli.styledHeader(delivery.id)
  cli.styledObject(obj)

  cli.styledHeader('Event Payload')
  cli.styledJSON(event.payload)
}

module.exports = {
  topic: 'webhooks',
  command: 'deliveries:info',
  description: 'info for a webhook event on an app',
  args: [{name: 'id'}],
  flags: [
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to show info', hidden: true}
  ],
  help: `Example:

 $ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999
`,
  wantsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
