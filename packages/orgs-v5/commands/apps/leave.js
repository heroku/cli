'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  let request = heroku.get('/account')
    .then(function (user) {
      return heroku.delete(`/apps/${context.app}/collaborators/${encodeURIComponent(user.email)}`).catch(function (error) {
        console.log(error)
        throw new Error(error.body)
      })
    })
  await cli.action(`Leaving ${cli.color.cyan(context.app)}`, request)
}

let cmd = {
  topic: 'apps',
  command: 'leave',
  description: 'remove yourself from a team app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(run),
}

let root = Object.assign({}, cmd, {topic: 'leave', command: null})
module.exports = [cmd, root]
