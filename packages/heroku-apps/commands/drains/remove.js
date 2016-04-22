'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let drain = yield heroku.request({
    method: 'delete',
    path: `/apps/${context.app}/log-drains/${encodeURIComponent(context.args.url)}`
  })
  cli.log(`Successfully removed drain ${cli.color.cyan(drain.url)}`)
}

module.exports = {
  topic: 'drains',
  command: 'remove',
  description: 'adds a log drain to an app',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'url'}],
  run: cli.command(co.wrap(run))
}
