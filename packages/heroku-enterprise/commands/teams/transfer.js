let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * transfer(context, heroku) {
  let team = context.args.team
  let enterpriseAccount = context.flags['enterprise-account']

  let params = { body: { enterprise_account: enterpriseAccount } }
  let transfer = heroku.post(`/teams/${team}/actions/transfer`, params)

  yield cli.action(`Transferring ${cli.color.cyan(team)} to ${cli.color.green(enterpriseAccount)}`, transfer)
}

module.exports = {
  topic: 'teams',
  command: 'transfer',
  description: 'transfer a team to an enterprise account',
  needsAuth: true,
  flags: [
    {
      name: 'enterprise-account',
      description: 'enterprise account name',
      hasValue: true,
      required: true
    }
  ],
  args: [{ name: 'team', description: 'name of the team to transfer' } ],
  run: cmd.run(transfer)
};
