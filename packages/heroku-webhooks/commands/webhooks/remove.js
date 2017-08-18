'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  yield cli.action(`Removing webhook ${context.args.id} from ${cli.color.app(context.app)}`, {},
    heroku.delete(`/apps/${context.app}/webhooks/${context.args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
    }
  ))
}

module.exports = {
  topic: 'webhooks',
  command: 'remove',
  args: [
    {name: 'id', description: 'id of webhook to remove'}
  ],
  description: 'removes a webhook from an app',
  help: `Example:

 $ heroku webhooks:remove 99999999-9999-9999-9999-999999999999
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
