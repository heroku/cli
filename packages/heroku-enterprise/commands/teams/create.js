let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * transfer(context, heroku) {
  let team = context.args.team
  let enterpriseAccount = context.flags['enterprise-account']

  let params = { body: { name: team, enterprise_account: enterpriseAccount } }
  let createdTeam = heroku.post(`/teams`, params)

  yield cli.action(`Creating ${cli.color.cyan(team)} in ${cli.color.green(enterpriseAccount)}`, createdTeam)
}

module.exports = {
  topic: 'teams',
  command: 'create',
  description: 'Create a team in an enterprise account',
  needsAuth: true,
  flags: [
    {
      name: 'enterprise-account',
      description: 'enterprise account name',
      hasValue: true,
      required: true
    }
  ],
  args: [{ name: 'team', description: 'name of the team to create' } ],
  run: cmd.run(transfer)
};
