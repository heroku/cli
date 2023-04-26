'use strict'

let cli = require('heroku-cli-util')
let authorizations = require('../../authorizations')

async function run(context, heroku) {
  let auth = await cli.action('Rotating OAuth Authorization', heroku.request({
    method: 'POST',
    path: `/oauth/authorizations/${encodeURIComponent(context.args.id)}/actions/regenerate-tokens`,
  }))

  authorizations.display(auth)
}

module.exports = {
  topic: 'authorizations',
  command: 'rotate',
  description: 'updates an OAuth authorization token',
  needsAuth: true,
  args: [{name: 'id'}],
  flags: [],
  run: cli.command(run),
}
