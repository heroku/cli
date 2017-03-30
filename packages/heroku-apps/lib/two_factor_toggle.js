'use strict'
const cli = require('heroku-cli-util')

module.exports = function * (context, heroku, on) {
  let password = yield cli.prompt('Password', {hide: true})
  let body = {password: password, two_factor_authentication: on}
  let account = yield heroku.patch('/account', {body: body})
  if (account.two_factor_authentication) {
    cli.log('Two-factor authentication is enabled')
  } else {
    cli.log('Two-factor authentication is disabled')
  }
}
