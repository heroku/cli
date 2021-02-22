'use strict'

let cli = require('heroku-cli-util')
let authorizations = require('../../authorizations')

async function run(context, heroku) {
  let auth = await heroku.get(`/oauth/authorizations/${encodeURIComponent(context.args.id)}`)
  if (context.flags.json) {
    cli.styledJSON(auth)
  } else {
    authorizations.display(auth)
  }
}

module.exports = {
  topic: 'authorizations',
  command: 'info',
  description: 'show an existing OAuth authorization',
  needsAuth: true,
  flags: [
    {char: 'j', name: 'json', description: 'output in json format'}
  ],
  args: [{name: 'id'}],
  run: cli.command(run)
}
