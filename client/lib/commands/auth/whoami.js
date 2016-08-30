'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run () {
  const Heroku = require('heroku-client')

  if (process.env.HEROKU_API_KEY) {
    cli.warn('HEROKU_API_KEY is set. Not using netrc credentials.')
  }
  let token = cli.auth.token()
  if (!token) cli.exit(1, 'not logged in')
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
