'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let webhookType = require('../../lib/webhook_type.js')

function * run (context, heroku) {
  let {path} = webhookType(context)

  let webhook = yield heroku.get(`${path}/webhooks/${context.args.id}`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
  })

  let obj = {
    'Webhook ID': webhook.id,
    'URL': webhook.url,
    'Include': webhook.include.join(','),
    'Level': webhook.level
  }

  cli.styledHeader(webhook.id)
  cli.styledObject(obj)
}

module.exports = {
  topic: 'webhooks',
  command: 'info',
  description: 'info for a webhook on an app',
  args: [{name: 'id'}],
  flags: [
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to show info', hidden: true}
  ],
  help: `Example:

 $ heroku webhooks:info 99999999-9999-9999-9999-999999999999
`,
  wantsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
