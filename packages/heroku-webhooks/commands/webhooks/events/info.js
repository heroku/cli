'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  cli.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')
  let webhookEvent = yield heroku.get(`/apps/${context.app}/webhook-events/${context.args.id}`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
  })

  let obj = {
    payload: JSON.stringify(webhookEvent.payload, null, 2)
  }

  cli.styledHeader(webhookEvent.id)
  cli.styledObject(obj)
}

module.exports = {
  topic: 'webhooks',
  command: 'events:info',
  description: 'info for a webhook event on an app',
  args: [{name: 'id'}],
  help: `Example:

 $ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999
`,
  needsApp: true,
  needsAuth: true,
  hidden: true,
  run: cli.command(co.wrap(run))
}
