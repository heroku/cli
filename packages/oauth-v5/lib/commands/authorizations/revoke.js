'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let auth = await cli.action('Revoking OAuth Authorization', {success: false}, heroku.request({
    method: 'DELETE',
    path: `/oauth/authorizations/${encodeURIComponent(context.args.id)}`
  }))
  cli.log(`done, revoked authorization from ${cli.color.cyan(auth.description)}`)
}

module.exports = {
  topic: 'authorizations',
  command: 'revoke',
  aliases: ['authorizations:destroy'],
  description: 'revoke OAuth authorization',
  needsAuth: true,
  args: [{name: 'id'}],
  run: cli.command(run)
}
