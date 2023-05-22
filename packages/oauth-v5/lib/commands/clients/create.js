'use strict'

let cli = require('heroku-cli-util')
let lib = require('../../clients')

async function run(context, heroku) {
  let url = context.args.redirect_uri
  lib.validateURL(url)
  let request = heroku.request({
    method: 'POST',
    path: '/oauth/clients',
    body: {
      name: context.args.name,
      redirect_uri: url,
    },
  })
  let client
  if (context.flags.shell || context.flags.json) {
    client = await request
  } else {
    client = await cli.action(`Creating ${context.args.name}`, request)
  }

  if (context.flags.json) {
    cli.styledJSON(client)
  } else {
    cli.log(`HEROKU_OAUTH_ID=${client.id}`)
    cli.log(`HEROKU_OAUTH_SECRET=${client.secret}`)
  }
}

module.exports = {
  topic: 'clients',
  command: 'create',
  description: 'create a new OAuth client',
  needsAuth: true,
  args: [{name: 'name'}, {name: 'redirect_uri'}],
  flags: [
    {name: 'shell', char: 's', description: 'output in shell format'},
    {char: 'j', name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}
