'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let webhookType = require('../../lib/webhook_type.js')

function * run (context, heroku) {
  let {path, display} = webhookType(context)
  yield cli.action(`Updating webhook ${context.args.id} for ${display}`, {},
    heroku.patch(`${path}/webhooks/${context.args.id}`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
      body: {
        include: context.flags.include && context.flags.include.split(',').map((s) => s.trim()),
        level: context.flags.level,
        secret: context.flags.secret,
        url: context.flags.url
      }
    }
  ))
}

module.exports = {
  topic: 'webhooks',
  command: 'update',
  args: [
    {name: 'id', description: 'id of webhook to remove'}
  ],
  flags: [
    {name: 'include', char: 'i', description: 'comma delimited webhook types', hasValue: true},
    {name: 'level', char: 'l', description: 'webhook notification level', hasValue: true},
    {name: 'secret', char: 's', description: 'comma delimited hook types', hasValue: true},
    {name: 'url', char: 'u', description: 'url to send webhook to', hasValue: true},
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline on which to remove', hidden: true}
  ],
  description: 'updates a webhook in an app',
  help: `Example:

 $ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks
`,
  wantsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
