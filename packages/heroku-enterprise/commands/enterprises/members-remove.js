let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * membersRemove(context, heroku) {
  let enterpriseAccount = context.flags['enterprise-account']
  let member = context.args.email
  let deleteMember = heroku.delete(`/enterprise-accounts/${enterpriseAccount}/members/${member}`)
  let formattedEmail = cli.color.cyan(member)
  let formattedAccount = cli.color.green(enterpriseAccount)
  yield cli.action(`Removing ${formattedEmail} to ${formattedAccount}`, deleteMember)
}

module.exports = {
  topic: 'enterprises',
  command: 'members-remove',
  description: 'remove a member from an enterprise account',
  needsAuth: true,
  flags: [
    {
      name: 'enterprise-account',
      description: 'enterprise account name',
      hasValue: true,
      required: true
    }
  ],
  args: [{name: 'email', hasValue: true, required: true}],
  run: cmd.run(membersRemove)
}
