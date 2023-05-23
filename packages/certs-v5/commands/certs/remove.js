'use strict'

let cli = require('heroku-cli-util')

let flags = require('../../lib/flags.js')
let formatEndpoint = require('../../lib/format_endpoint.js')

async function run(context, heroku) {
  let endpoint = await flags(context, heroku)

  let formattedEndpoint = formatEndpoint(endpoint)

  await cli.confirmApp(context.app, context.flags.confirm, `WARNING: Destructive Action - you cannot rollback this change\nThis command will remove the endpoint ${formattedEndpoint} from ${cli.color.app(context.app)}.`)

  let _ = await cli.action(`Removing SSL certificate ${formattedEndpoint} from ${cli.color.app(context.app)}`, {}, heroku.request({
    path: endpoint._meta.path,
    method: 'DELETE',
    headers: {Accept: `application/vnd.heroku+json; version=3.${endpoint._meta.variant}`},
  }))
}

module.exports = {
  topic: 'certs',
  command: 'remove',
  flags: [
    {name: 'confirm', hasValue: true, hidden: true},
    {name: 'name', hasValue: true, description: 'name to remove'},
    {name: 'endpoint', hasValue: true, description: 'endpoint to remove'},
  ],
  description: 'remove an SSL certificate from an app',
  needsApp: true,
  needsAuth: true,
  run: cli.command(run),
}
