'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let deliveries = yield heroku.request({
    path: `/apps/${context.app}/webhook-deliveries`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
    method: 'GET'
  })
  if (deliveries.length === 0) {
    cli.log(`${cli.color.app(context.app)} has no deliveries`)
  } else {
    cli.table(deliveries, {columns: [
      {key: 'id', label: 'ID'},
      {key: 'event', label: 'Event', get: (w) => w.event.id},
      {key: 'webhook', label: 'Webhook', get: (w) => w.webhook.id},
      {key: 'status', label: 'status', get: (w) => w.status}
    ]})
  }
}

module.exports = {
  topic: 'webhooks',
  command: 'deliveries',
  description: 'list webhook deliveries on an app',
  help: `Example:

 $ heroku webhooks:deliveries
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
