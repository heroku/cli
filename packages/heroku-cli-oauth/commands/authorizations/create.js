'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let authorizations = require('../../lib/authorizations')

function * run (context, heroku) {
  let auth = yield cli.action('Creating OAuth Authorization', heroku.request({
    method: 'POST',
    path: '/oauth/authorizations',
    body: {
      description: context.flags.description,
      scope: context.flags.scope ? context.flags.scope.split(',') : undefined,
      expires_in: context.flags['expires-in']
    }
  }))

  if (context.flags.short) {
    cli.log(auth.access_token.token)
  } else {
    authorizations.display(auth)
  }
}

module.exports = {
  topic: 'authorizations',
  command: 'create',
  description: 'create a new OAuth authorization',
  help: 'This creates an authorization with access to your Heroku account.',
  needsAuth: true,
  flags: [
    {char: 'd', name: 'description', hasValue: true, description: 'set a custom authorization description'},
    {char: 's', name: 'scope', hasValue: true, description: 'set custom OAuth scopes'},
    {char: 'e', name: 'expires-in', hasValue: true, description: 'set expiration in seconds'},
    {name: 'short', description: 'only output token'}
  ],
  run: cli.command(co.wrap(run))
}
