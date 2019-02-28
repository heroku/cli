'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let Utils = require('../../lib/utils')
const { flags } = require('@heroku-cli/command')
const { RoleCompletion } = require('@heroku-cli/command/lib/completions')

function * run (context, heroku) {
  let teamInfo = yield Utils.teamInfo(context, heroku)
  let groupName = context.org || context.team || context.flags.team
  let email = context.args.email
  let role = context.flags.role

  yield Utils.addMemberToTeam(email, role, groupName, heroku, 'PATCH')
  yield Utils.warnIfAtTeamMemberLimit(teamInfo, groupName, context, heroku)
  Utils.warnUsingOrgFlagInTeams(teamInfo, context)
}

let set = {
  topic: 'members',
  command: 'set',
  description: 'sets a members role in a team',
  needsAuth: true,
  wantsOrg: true,
  args: [{ name: 'email' }],
  flags: [
    { name: 'role', char: 'r', hasValue: true, required: true, description: 'member role (admin, collaborator, member, owner)', completion: RoleCompletion },
    flags.team({ name: 'team', hasValue: true, hidden: true })
  ],
  run: cli.command(co.wrap(run))
}

module.exports = set
