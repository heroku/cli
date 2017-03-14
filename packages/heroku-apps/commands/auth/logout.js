const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const Netrc = require('netrc-parser')
  const netrc = new Netrc()
  delete netrc.machines['api.heroku.com']
  delete netrc.machines['git.heroku.com']
  netrc.save()
  cli.log('Local credentials cleared')
}

const cmd = {
  description: 'display the current logged in user',
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'auth', command: 'logout'}, cmd),
  Object.assign({topic: 'logout'}, cmd)
]
