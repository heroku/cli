'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let webhookType = require('../../lib/webhook_type.js')

function * run (context, heroku) {
  let {path, display} = webhookType(context)

  let webhooks = yield heroku.get(`${path}/webhooks`, {
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'}
  })

  if (webhooks.length === 0) {
    cli.log(`${display} has no webhooks\nUse ${cli.color.cmd('heroku webhooks:add')} to add one.`)
    return
  }

  webhooks.sort((a, b) => Date.parse(a['created_at']) - Date.parse(b['created_at']))

  cli.table(webhooks, {columns: [
    {key: 'id', label: 'Webhook ID'},
    {key: 'url', label: 'URL'},
    {key: 'include', label: 'Include'},
    {key: 'level', label: 'Level'}
  ]})
}

module.exports = {
  topic: 'webhooks',
  description: 'list webhooks on an app',
  help: `Example:

 $ heroku webhooks
`,
  wantsApp: true,
  flags: [
    {name: 'pipeline', char: 'p', hasValue: true, description: 'pipeline to list', hidden: true}
  ],
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
