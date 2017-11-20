'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let webhookType = require('../../lib/webhook_type.js')

function * run (context, heroku) {
  let {path, display} = webhookType(context)
  yield cli.action(`Removing webhook ${context.args.id} from ${display}`, {},
    heroku.delete(`${path}/webhooks/${context.args.id}`, {
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
  flags: [
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to remove', hidden: true}
  ],
  description: 'removes a webhook from an app',
  help: `Example:

 $ heroku webhooks:remove 99999999-9999-9999-9999-999999999999
`,
  wantsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
