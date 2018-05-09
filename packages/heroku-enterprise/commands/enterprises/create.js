'use strict'

let cmd = require('../../lib/cmd')
let cli = require('heroku-cli-util')

function * create (context, heroku) {
  let enterpriseAccountName = context.args.name
  let managers = context.flags.managers.split(',')
  let params = { body: { name: enterpriseAccountName, managers: managers } }
  let create = heroku.post(`/admin/enterprise-accounts`, params)
  cli.action(`Creating ${enterpriseAccountName}`, create)
}

module.exports = {
  topic: 'enterprises',
  command: 'create',
  description: '(sudo) create an enterprise account',
  needsAuth: true,
  flags: [{name: 'managers', hasValue: true, required: true}],
  args: [{name: 'name', hasValue: true, required: true}],
  run: cmd.run_admin(create)
}
