'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let webhook = yield heroku.get(`/apps/${context.app}/webhooks/${context.args.id}`, {
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
  help: `Example:

 $ heroku webhooks:info 99999999-9999-9999-9999-999999999999
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
