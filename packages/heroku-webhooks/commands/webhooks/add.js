'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  yield cli.action(`Adding webhook to ${cli.color.app(context.app)}`, {}, heroku.request({
    path: `/apps/${context.app}/webhooks`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
    method: 'POST',
    body: {
      include: context.flags.include.split(',').map((s) => s.trim()),
      level: context.flags.level,
      secret: context.flags.secret,
      url: context.flags.url
    }
  }))
}

module.exports = {
  topic: 'webhooks',
  command: 'add',
  flags: [
    {name: 'include', char: 'i', description: 'comma delimited webhook types', hasValue: true, required: true},
    {name: 'level', char: 'l', description: 'webhook notification level', hasValue: true, required: true},
    {name: 'secret', char: 's', description: 'comma delimited hook types', hasValue: true, required: true},
    {name: 'url', char: 'u', description: 'url to send webhook to', hasValue: true, required: true}
  ],
  description: 'add a webhook to an app',
  help: `Example:

 $ heroku webhooks:add -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
