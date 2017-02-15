let cli = require('heroku-cli-util')
let cmd = require('../../lib/cmd')

function * members(context, heroku) {
  let enterpriseAccount = context.flags['enterprise-account']
  let members = yield heroku.get(`/enterprise-accounts/${enterpriseAccount}/members`)
  let data = members.map(function(m) {
    return {
      email: m.user.email,
      permissions: m.permissions.map((p) => p.name).join(',')
    }
  })
  let columns = [
    { key: 'email', label: 'Email', format: e => cli.color.cyan(e) },
    { key: 'permissions', label: 'Permissions', format: e => cli.color.green(e) }
  ];
  cli.table(data, { printHeader: false, columns: columns })
}

module.exports = {
  topic: 'enterprises',
  command: 'members',
  description: 'list members of an enterprise account',
  needsAuth: true,
  flags: [
    {
      name: 'enterprise-account',
      description: 'enterprise account name',
      hasValue: true,
      required: true
    }
  ],
  run: cmd.run(members)
}

