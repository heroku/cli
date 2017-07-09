const cli = require('heroku-cli-util')
const co = require('co')
const twoFactorToggle = require('../../../two_factor_toggle')

function * run (context, heroku) {
  yield twoFactorToggle(context, heroku, false)
}

const cmd = {
  description: 'disable 2fa on account',
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'auth', command: '2fa:disable'}, cmd),
  Object.assign({topic: '2fa', command: 'disable'}, cmd),
  Object.assign({topic: 'twofactor', command: 'disable'}, cmd)
]
