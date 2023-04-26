'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = context.app
  let p = heroku.patch(`/apps/${app}`, {body: {maintenance: false}})
  await cli.action(`Disabling maintenance mode for ${cli.color.app(app)}`, p)
}

module.exports = {
  topic: 'maintenance',
  command: 'off',
  description: 'take the app out of maintenance mode',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run),
}
