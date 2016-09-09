'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let events = yield heroku.request({
    path: `/apps/${context.app}/webhook-events`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
    method: 'GET'
  })
  if (events.length === 0) {
    cli.log(`${cli.color.app(context.app)} has no events`)
  } else {
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
  help: `Example:

 $ heroku webhooks:events
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
