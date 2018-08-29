'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let request = heroku.get('/account')
    .then(function (user) {
      return heroku.post(`/organizations/apps/${context.app}/collaborators`, {
        body: { user: user.email }
      })
    })

  yield cli.action(`Joining ${cli.color.cyan(context.app)}`, request)
}

let cmd = {
  topic: 'apps',
  command: 'join',
  description: 'add yourself to an organization app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}

let root = Object.assign({}, cmd, { topic: 'join', command: null })
module.exports = [cmd, root]
