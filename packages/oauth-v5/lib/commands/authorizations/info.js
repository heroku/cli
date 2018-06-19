'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let authorizations = require('../../authorizations')

function * run (context, heroku) {
  let auth = yield heroku.get(`/oauth/authorizations/${encodeURIComponent(context.args.id)}`)
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
  run: cli.command(co.wrap(run))
}
