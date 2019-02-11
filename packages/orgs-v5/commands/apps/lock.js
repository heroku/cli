'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = yield heroku.get(`/teams/apps/${context.app}`)
  if (app.locked) {
    throw new Error(`Error: cannot lock ${cli.color.cyan(app.name)}
This app is already locked.`)
  }
  let request = heroku.request({
    method: 'PATCH',
    path: `/teams/apps/${app.name}`,
    body: { locked: true }
  })
  yield cli.action(`Locking ${cli.color.cyan(app.name)}`, request)
}

let cmd = {
  description: 'prevent team members from joining an app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({ topic: 'apps', command: 'lock' }, cmd),
  Object.assign({ topic: 'lock' }, cmd)
]
