'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let id = context.args.id
  let request = heroku.request({
    method: 'DELETE',
    path: `/oauth/clients/${id}`
  })
  yield cli.action(`Destroying ${cli.color.cyan(id)}`, request)
}

module.exports = {
  topic: 'clients',
  command: 'destroy',
  description: 'delete client by ID',
  needsAuth: true,
  args: [{name: 'id'}],
  run: cli.command(co.wrap(run))
}
