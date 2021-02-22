'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let app = await heroku.get(`/teams/apps/${context.app}`)
  if (!app.locked) {
    throw new Error(`Error: cannot unlock ${cli.color.cyan(app.name)}
This app is not locked.`)
  }
  let request = heroku.request({
    method: 'PATCH',
    path: `/teams/apps/${app.name}`,
    body: { locked: false }
  })
  await cli.action(`Unlocking ${cli.color.cyan(app.name)}`, request)
}

let cmd = {
  topic: 'apps',
  command: 'unlock',
  description: 'unlock an app so any team member can join',
  needsAuth: true,
  needsApp: true,
  run: cli.command(run)
}

let root = Object.assign({}, cmd, { topic: 'unlock', command: null })
module.exports = [cmd, root]
