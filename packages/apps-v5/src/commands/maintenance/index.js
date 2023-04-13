'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = await heroku.get(`/apps/${context.app}`)
  cli.log(app.maintenance ? 'on' : 'off')
}

module.exports = {
  topic: 'maintenance',
  description: 'display the current maintenance status of app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run),
}
