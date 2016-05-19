'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = yield heroku.get(`/apps/${context.app}`)
  cli.log(app.maintenance ? 'on' : 'off')
}

module.exports = {
  topic: 'maintenance',
  description: 'display the current maintenance status of app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
