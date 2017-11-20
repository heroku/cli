'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let webhookType = require('../../../lib/webhook_type.js')

function * run (context, heroku) {
  cli.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info')

  let {path} = webhookType(context)
  let webhookEvent = yield heroku.get(`${path}/webhook-events/${context.args.id}`, {
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
  flags: [
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to show info', hidden: true}
  ],
  help: `Example:

 $ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999
`,
  wantsApp: true,
  needsAuth: true,
  hidden: true,
  run: cli.command(co.wrap(run))
}
