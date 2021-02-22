'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = context.app
  let p = heroku.patch(`/apps/${app}`, { body: { maintenance: true } })
  await cli.action(`Enabling maintenance mode for ${cli.color.app(app)}`, p)
}

module.exports = {
  topic: 'maintenance',
  command: 'on',
  description: 'put the app into maintenance mode',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run)
}
