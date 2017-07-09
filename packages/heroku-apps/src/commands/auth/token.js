const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  if (process.env.HEROKU_API_KEY) cli.warn('HEROKU_API_KEY is set')
  if (!context.auth.password) throw new Error('not logged in')
  cli.log(context.auth.password)
}

module.exports = {
  topic: 'auth',
  command: 'token',
  description: 'display the current auth token',
  run: cli.command(co.wrap(run))
}
