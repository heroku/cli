'use strict'

let cmd = require('../../lib/cmd')
let cli = require('heroku-cli-util')

function * list (context, heroku) {
  let teams = yield heroku.get('/organizations')
  let data = teams.map(function(t) {
    if (t.enterprise_account) {
      return { team: t.name, enterpriseAccount: t.enterprise_account.name }
    } else {
      return { team: t.name, enterpriseAccount: 'n/a' }
    }
  })
  let columns = [
    { key: 'team', label: 'Team', format: e => cli.color.cyan(e) },
    { key: 'enterpriseAccount', label: 'Enterprise Account', format: e => cli.color.green(e) }
  ]
  cli.table(data, { columns: columns })
}

module.exports = {
  topic: 'teams',
  description: 'list the teams that you are a member of',
  needsAuth: true,
  run: cmd.run(list)
}
