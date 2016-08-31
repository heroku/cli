'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let webhooks = yield heroku.request({
    path: `/apps/${context.app}/webhooks`,
    headers: {Accept: 'application/vnd.heroku+json; version=3.webhooks'},
    method: 'GET'
  })
  if (webhooks.length === 0) {
    cli.log(`${cli.color.app(context.app)} has no webhooks\nUse ${cli.color.cmd('heroku webhooks:add')} to add one.`)
  } else {
    cli.table(webhooks, {columns: [
      {key: 'id', label: 'ID'},
      {key: 'url', label: 'URL'},
      {key: 'include', label: 'Include'},
      {key: 'level', label: 'Level'}
    ]})
  }
}

module.exports = {
  topic: 'webhooks',
  description: 'list webhooks on an app',
  help: `Example:

 $ heroku webhooks
`,
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
