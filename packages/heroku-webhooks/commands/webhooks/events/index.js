'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let webhookType = require('../../../lib/webhook_type.js')

function * run (context, heroku) {
  cli.warn('heroku webhooks:event is deprecated, please use heroku webhooks:deliveries')

  let {path, display} = webhookType(context)
  let events = yield heroku.get(`${path}/webhook-events`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
  })
  if (events.length === 0) {
    cli.log(`${display} has no events`)
  } else {
    events.sort((a, b) => Date.parse(a['created_at']) - Date.parse(b['created_at']))

    cli.table(events, {columns: [
      {key: 'id', label: 'Event ID'},
      {key: 'resource', label: 'Resource', get: (w) => w.payload.resource},
      {key: 'action', label: 'Action', get: (w) => w.payload.action},
      {key: 'published_at', label: 'Published At', get: (w) => w.payload.published_at}
    ]})
  }
}

module.exports = {
  topic: 'webhooks',
  command: 'events',
  description: 'list webhook events on an app',
  flags: [
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to list', hidden: true}
  ],
  help: `Example:

 $ heroku webhooks:events
`,
  wantsApp: true,
  needsAuth: true,
  hidden: true,
  run: cli.command(co.wrap(run))
}
