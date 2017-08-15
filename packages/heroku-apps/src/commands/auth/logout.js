const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  yield cli.logout()
  cli.log('Local credentials cleared')
}

const cmd = {
  description: 'clears local login credentials',
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'auth', command: 'logout'}, cmd),
  Object.assign({topic: 'logout'}, cmd)
]
