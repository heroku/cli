const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  let password = yield cli.prompt('Password', {hide: true})
  let headers = {'Heroku-Password': password}
  let codes = yield heroku.post('/account/recovery-codes', {headers: headers})
  cli.log('Recovery codes:')
  for (var i in codes) cli.log(codes[i])
}

const cmd = {
  description: 'generates and replaces recovery codes',
  needsAuth: true,
  run: cli.command(co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'auth', command: '2fa:generate'}, cmd),
  Object.assign({topic: '2fa', command: 'generate-recovery-codes'}, cmd),
  Object.assign({topic: 'twofactor', command: 'generate-recovery-codes'}, cmd)
]
