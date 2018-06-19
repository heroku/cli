'use strict'

let co = require('co')
let cli = require('heroku-cli-util')

function * run (context, heroku) {
  let auth = yield cli.action('Revoking OAuth Authorization', {success: false}, heroku.request({
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
  run: cli.command(co.wrap(run))
}
