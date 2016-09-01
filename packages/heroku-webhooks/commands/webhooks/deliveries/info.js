'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let delivery = yield heroku.request({
    path: `/apps/${context.app}/webhook-deliveries/${context.args.id}`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
    method: 'GET'
  })

  let obj = {
    event: delivery.event.id,
    webhook: delivery.webhook.id,
    status: delivery.status
  }

  cli.styledHeader(delivery.id)
  cli.styledObject(obj)
}

module.exports = {
  topic: 'webhooks',
  command: 'deliveries:info',
  description: 'info for a webhook event on an app',
  args: [{name: 'id'}],
  help: `Example:

 $ heroku webhooks:deliveries:info 99999999-9999-9999-9999-999999999999
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
