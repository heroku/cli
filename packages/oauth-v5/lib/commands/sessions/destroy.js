'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let id = context.args.id
  yield cli.action(`Destroying ${cli.color.cyan(id)}`, co(function * () {
    yield heroku.request({
      method: 'DELETE',
      path: `/oauth/sessions/${id}`
    })
  }))
}

module.exports = {
  topic: 'sessions',
  command: 'destroy',
  description: 'delete (logout) OAuth session by ID',
  needsAuth: true,
  args: [{name: 'id'}],
  run: cli.command(co.wrap(run))
}
