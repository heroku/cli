'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let app = yield heroku.get(`/organizations/apps/${context.app}`)
  if (!app.locked) {
    throw new Error(`Error: cannot unlock ${cli.color.cyan(app.name)}
This app is not locked.`)
  }
  let request = heroku.request({
    method: 'PATCH',
    path: `/organizations/apps/${app.name}`,
    body: { locked: false }
  })
  yield cli.action(`Unlocking ${cli.color.cyan(app.name)}`, request)
}

let cmd = {
  topic: 'apps',
  command: 'unlock',
  description: 'unlock an app so any organization member can join',
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}

let root = Object.assign({}, cmd, { topic: 'unlock', command: null })
module.exports = [cmd, root]
