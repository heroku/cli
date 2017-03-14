const cli = require('heroku-cli-util')
const co = require('co')

function notloggedin () {
  console.error('not logged in')
  cli.exit(100)
}

function * run (context, heroku) {
  if (process.env.HEROKU_API_KEY) cli.warn('HEROKU_API_KEY is set')
  if (!context.auth.password) notloggedin()
  try {
    let account = yield heroku.get('/account')
    cli.log(account.email)
  } catch (err) {
    if (err.statusCode === 401) notloggedin()
    throw err
  }
}

const cmd = {
  description: 'display the current logged in user',
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'auth', command: 'whoami'}, cmd),
  Object.assign({topic: 'whoami'}, cmd)
]
