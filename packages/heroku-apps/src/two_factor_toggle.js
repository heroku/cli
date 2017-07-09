'use strict'
const cli = require('heroku-cli-util')

module.exports = function * (context, heroku, on) {
  let account = yield heroku.get('/account')
  if ((on && account.two_factor_authentication) || (!on && !account.two_factor_authentication)) {
    let enabled = account.two_factor_authentication ? 'enabled' : 'disabled'
    throw new Error(`Two-factor authentication is already ${enabled}`)
  } else {
    let password = yield cli.prompt('Password', {hide: true})
    let body = {password, two_factor_authentication: on}
    let account = yield heroku.patch('/account', {body})
    let enabled = account.two_factor_authentication ? 'enabled' : 'disabled'
    cli.log(`Two-factor authentication has been ${enabled}`)
  }
}
