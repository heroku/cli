let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * membersAdd(context, heroku) {
  let enterpriseAccount = context.flags['enterprise-account']
  let member = context.args.email
  let permissionsString = context.flags.permissions
  let permissions = permissionsString.split(',')
  let params = { body: { user: member, permissions: permissions } }
  let members = yield heroku.get(`/enterprise-accounts/${enterpriseAccount}/members`)
  let req = function() {
    if(members.map((m) => m.user.email).includes(member)) {
      return heroku.patch(`/enterprise-accounts/${enterpriseAccount}/members/${member}`, params)
    } else {
      return heroku.post(`/enterprise-accounts/${enterpriseAccount}/members`, params)
    }
  }()

  let formattedEmail = cli.color.cyan(member)
  let formattedAccount = cli.color.green(enterpriseAccount)
  yield cli.action(`Adding ${formattedEmail} to ${formattedAccount}`, req)
}

module.exports = {
  topic: 'enterprises',
  command: 'members-add',
  description: 'add a member to an enterprise account',
  needsAuth: true,
  flags: [
    {
      name: 'enterprise-account',
      description: 'enterprise account name',
      hasValue: true,
      required: true
    },
    {
      name: 'permissions',
      description: 'permissions to grant the member',
      hasValue: true,
      required: true
    }
  ],
  args: [{name: 'email', hasValue: true, required: true}],
  run: cmd.run(membersAdd)
}
