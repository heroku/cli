'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let request = heroku.get('/account')
    .then(function (user) {
      return heroku.delete(`/apps/${context.app}/collaborators/${encodeURIComponent(user.email)}`).catch(function (err) {
        console.log(err)
        throw new Error(err.body)
      })
    })
  yield cli.action(`Leaving ${cli.color.cyan(context.app)}`, request)
}

let cmd = {
  topic: 'apps',
  command: 'leave',
  description: 'remove yourself from a team app',
  needsAuth: true,
  needsApp: true,
  run: cli.command(co.wrap(run))
}

let root = Object.assign({}, cmd, { topic: 'leave', command: null })
module.exports = [cmd, root]
