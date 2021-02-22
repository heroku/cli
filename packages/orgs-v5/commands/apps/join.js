'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let request = heroku.get('/account')
    .then(function (user) {
      return heroku.post(`/teams/apps/${context.app}/collaborators`, {
        body: { user: user.email }
      })
    })

  await cli.action(`Joining ${cli.color.cyan(context.app)}`, request)
}

let cmd = {
  topic: 'apps',
  command: 'join',
  description: 'add yourself to a team app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(run)
}

let root = Object.assign({}, cmd, { topic: 'join', command: null })
module.exports = [cmd, root]
