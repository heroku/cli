'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = await heroku.get(`/teams/apps/${context.app}`)
  if (app.locked) {
    throw new Error(`Error: cannot lock ${cli.color.cyan(app.name)}
This app is already locked.`)
  }
  let request = heroku.request({
    method: 'PATCH',
    path: `/teams/apps/${app.name}`,
    body: { locked: true }
  })
  await cli.action(`Locking ${cli.color.cyan(app.name)}`, request)
}

let cmd = {
  description: 'prevent team members from joining an app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(run)
}

module.exports = [
  Object.assign({ topic: 'apps', command: 'lock' }, cmd),
  Object.assign({ topic: 'lock' }, cmd)
]
