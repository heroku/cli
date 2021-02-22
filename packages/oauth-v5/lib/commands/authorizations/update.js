'use strict'

let cli = require('heroku-cli-util')
let authorizations = require('../../authorizations')

async function run(context, heroku) {
  let client
  if (context.flags['client-id']) {
    client = {
      id: context.flags['client-id'],
      secret: context.flags['client-secret']
    }
  }
  let auth = await cli.action('Updating OAuth Authorization', heroku.request({
    method: 'PATCH',
    path: `/oauth/authorizations/${encodeURIComponent(context.args.id)}`,
    body: {
      client,
      description: context.flags.description
    }
  }))

  authorizations.display(auth)
}

module.exports = {
  topic: 'authorizations',
  command: 'update',
  description: 'updates an OAuth authorization',
  needsAuth: true,
  args: [{name: 'id'}],
  flags: [
    {char: 'd', name: 'description', hasValue: true, description: 'set a custom authorization description'},
    {name: 'client-id', hasValue: true, description: 'identifier of OAuth client to set'},
    {name: 'client-secret', hasValue: true, description: 'secret of OAuth client to set'}
  ],
  run: cli.command(run)
}
