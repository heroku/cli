'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let drain = await heroku.request({
    method: 'post',
    path: `/apps/${context.app}/log-drains`,
    body: { url: context.args.url }
  })
  cli.log(`Successfully added drain ${cli.color.cyan(drain.url)}`)
}

module.exports = {
  topic: 'drains',
  command: 'add',
  description: 'adds a log drain to an app',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'url' }],
  run: cli.command(run)
}
