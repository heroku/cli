'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let hostname = context.args.hostname
  yield cli.action(`Removing ${cli.color.green(hostname)} from ${cli.color.app(context.app)}`, heroku.request({
    path: `/apps/${context.app}/domains/${hostname}`,
    method: 'DELETE'
  }))
}

module.exports = {
  topic: 'domains',
  command: 'remove',
  description: 'remove domain from an app',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'hostname' }],
  run: cli.command(co.wrap(run))
}
