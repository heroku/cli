'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context) {
  const Heroku = require('heroku-client')
  let token = cli.auth.token()
  if (!token) {
    cli.error('not logged in')
    process.exit(1)
  }
  let heroku = new Heroku({token})
  let account = yield heroku.get('/account')
  cli.log(account.email)
}

module.exports = {
  topic: 'auth',
  command: 'whoami',
  description: 'display the logged in Heroku user',
  run: co.wrap(run)
}
