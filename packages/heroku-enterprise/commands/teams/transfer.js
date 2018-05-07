let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * transfer(context, heroku) {
  let team = context.args.team
  let enterpriseAccount = context.flags['enterprise-account']
  let internal = context.flags['internal']

  let params = { body: { enterprise_account: enterpriseAccount, internal: internal } }
  let transfer = heroku.post(`/admin/teams/${team}/actions/transfer`, params)

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
    },
    {
      name: 'internal',
      description: 'mark the billing for the team as internal',
      hasValue: false
    }
  ],
  args: [{ name: 'team', description: 'name of the team to transfer' } ],
  run: cmd.run_admin(transfer)
};
