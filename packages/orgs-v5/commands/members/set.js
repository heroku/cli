'use strict'

let cli = require('heroku-cli-util')
let Utils = require('../../lib/utils')
const {flags} = require('@heroku-cli/command')
const {RoleCompletion} = require('@heroku-cli/command/lib/completions')

async function run(context, heroku) {
  let teamInfo = await Utils.teamInfo(context, heroku)
  let groupName = context.flags.team
  let email = context.args.email
  let role = context.flags.role

  await Utils.addMemberToTeam(email, role, groupName, heroku, 'PATCH')
  await Utils.warnIfAtTeamMemberLimit(teamInfo, groupName, context, heroku)
}

let set = {
  topic: 'members',
  command: 'set',
  description: 'sets a members role in a team',
  needsAuth: true,
  wantsOrg: true,
  args: [{name: 'email'}],
  flags: [
    {name: 'role', char: 'r', hasValue: true, required: true, description: 'member role (admin, collaborator, member, owner)', completion: RoleCompletion},
    flags.team({name: 'team', hasValue: true, hidden: true}),
  ],
  run: cli.command(run),
}

module.exports = set
