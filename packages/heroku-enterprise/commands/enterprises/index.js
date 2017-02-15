let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * list(context, heroku) {
  let enterpriseAccounts = yield heroku.get('/enterprise-accounts')
  enterpriseAccounts.forEach(e => console.log(e.name))
}

module.exports = {
  topic: 'enterprises',
  description: 'list your enterprise accounts',
  needsAuth: true,
  run: cmd.run(list)
}
