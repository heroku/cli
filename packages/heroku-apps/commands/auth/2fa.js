const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  let account = yield heroku.get('/account')
  if (account.two_factor_authentication) {
    cli.log('Two-factor authentication is enabled')
  } else {
    cli.log('Two-factor authentication is not enabled')
  }
}

const cmd = {
  description: 'check 2fa status',
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'auth', command: '2fa'}, cmd),
  Object.assign({topic: '2fa'}, cmd),
  Object.assign({topic: 'twofactor'}, cmd)
]
