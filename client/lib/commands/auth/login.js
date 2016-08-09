'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run () {
  yield cli.auth.login()
  let account = yield this.heroku.get('/account')
  cli.log(`Logged in as ${cli.color.cyan(account.email)}`)
}

let cmd = {
  description: 'login with your Heroku credentials',
  run: co.wrap(run)
}

module.exports = [
  Object.assign({topic: 'auth', command: 'login'}, cmd),
  Object.assign({topic: 'login', hidden: true}, cmd)
]
