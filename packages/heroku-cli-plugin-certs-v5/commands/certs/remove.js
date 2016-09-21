'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

let flags = require('../../lib/flags.js')
let endpoints = require('../../lib/endpoints.js')

function * run (context, heroku) {
  let endpoint = yield flags(context, heroku)

  let cname = endpoint.cname ? `(${endpoint.cname}) ` : ''

  yield cli.confirmApp(context.app, context.flags.confirm, `Potentially Destructive Action\nThis command will remove the endpoint ${endpoint.name} ${cname}from ${cli.color.app(context.app)}.`)

  let actions = yield {
    action: cli.action(`Removing SSL certificate ${endpoint.name} ${cname}from ${cli.color.app(context.app)}`, {}, heroku.request({
      path: endpoint._meta.path,
      method: 'DELETE',
      headers: {'Accept': `application/vnd.heroku+json; version=3.${endpoint._meta.variant}`}
    })),
    hasAddon: endpoints.hasAddon(context.app, heroku)
  }

  if (actions.hasAddon) {
    cli.log('NOTE: Billing is still active. Remove SSL Endpoint add-on to stop billing.')
  }
}

let cmd = {
  command: 'remove',
  flags: [
    {name: 'confirm', hasValue: true, hidden: true},
    {name: 'name', hasValue: true, description: 'name to remove'},
    {name: 'endpoint', hasValue: true, description: 'endpoint to remove'}
  ],
  description: 'remove an SSL certificate from an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'certs'}, cmd),
  Object.assign({topic: '_certs', hidden: true}, cmd)
]
