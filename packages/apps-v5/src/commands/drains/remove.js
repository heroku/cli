'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let drain = await heroku.request({
    method: 'delete',
    path: `/apps/${context.app}/log-drains/${encodeURIComponent(context.args.url)}`,
  })
  cli.log(`Successfully removed drain ${cli.color.cyan(drain.url)}`)
}

module.exports = {
  topic: 'drains',
  command: 'remove',
  description: 'removes a log drain from an app',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'url'}],
  usage: 'drains:remove [URL|TOKEN]',
  run: cli.command(run),
}
