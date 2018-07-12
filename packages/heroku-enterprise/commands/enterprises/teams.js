let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * teams(context, heroku) {
  let enterpriseAccount = context.flags['enterprise-account']
  let teams = yield heroku.get(`/enterprise-accounts/${enterpriseAccount}/teams`)
  teams.forEach(team => console.log(team.name))
}

module.exports = {
  topic: 'enterprises',
  command: 'teams',
  description: 'list teams within an enterprise account',
  needsAuth: true,
  flags: [
    {
      name: 'enterprise-account',
      description: 'enterprise account name',
      hasValue: true,
      required: true
    }
  ],
  run: cmd.run(teams)
}

