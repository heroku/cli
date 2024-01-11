'use strict'

const cli = require('heroku-cli-util')
const authorizations = require('../../authorizations')

async function run(context, heroku) {
  let promise = heroku.request({
    method: 'POST',
    path: '/oauth/authorizations',
    body: {
      description: context.flags.description,
      scope: context.flags.scope ? context.flags.scope.split(',') : undefined,
      expires_in: context.flags['expires-in'],
    },
  })

  try {
    let access_token_feature = await heroku.get('/account/features/access-token-v2')
    if (access_token_feature && access_token_feature.enabled) {
      cli.warn('This token will only be visible while this terminal session is open. ' +
        'After that, you will not be able to retrieve it, so save it in a safe place.')
    }
  } catch (error) {
    if (error.statusCode === 404) {
      // No-Op - Feature is not enabled
    }
  }

  if (!context.flags.short && !context.flags.json) {
    promise = cli.action('Creating OAuth Authorization', promise)
  }

  let auth = await promise

  if (context.flags.short) {
    cli.log(auth.access_token.token)
  } else if (context.flags.json) {
    cli.styledJSON(auth)
  } else {
    authorizations.display(auth)
  }
}

const ScopeCompletion = {
  skipCache: true,
  options: () => {
    return ['global', 'identity', 'read', 'write', 'read-protected', 'write-protected']
  },
}

module.exports = {
  topic: 'authorizations',
  command: 'create',
  description: 'create a new OAuth authorization',
  help: 'This creates an authorization with access to your Heroku account.',
  needsAuth: true,
  flags: [
    {char: 'd', name: 'description', hasValue: true, description: 'set a custom authorization description'},
    {char: 's', name: 'scope', hasValue: true, description: 'set custom OAuth scopes', completion: ScopeCompletion},
    {char: 'e', name: 'expires-in', hasValue: true, description: 'set expiration in seconds (default no expiration)'},
    {char: 'S', name: 'short', description: 'only output token'},
    {char: 'j', name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}
