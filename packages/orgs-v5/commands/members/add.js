'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let Utils = require('../../lib/utils')
const { flags } = require('@heroku-cli/command')
const { RoleCompletion } = require('@heroku-cli/command/lib/completions')

function * run (context, heroku) {
  let teamInfo = yield Utils.teamInfo(context, heroku)
  let groupName = context.flags.team
  let email = context.args.email
  let role = context.flags.role
  let groupFeatures = yield heroku.get(`/teams/${groupName}/features`)

  let inviteMemberToTeam = function * (email, role, groupName) {
    let request = heroku.request({
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations'
      },
      method: 'PUT',
      path: `/teams/${groupName}/invitations`,
      body: { email, role }
    }).then(request => {
      cli.action.done('email sent')
    })

    yield cli.action(`Inviting ${cli.color.cyan(email)} to ${cli.color.magenta(groupName)} as ${cli.color.green(role)}`, request)
  }

  if (teamInfo.type === 'team' && groupFeatures.find(feature => { return feature.name === 'team-invite-acceptance' && feature.enabled })) {
    yield inviteMemberToTeam(email, role, groupName)
  } else {
    yield Utils.addMemberToTeam(email, role, groupName, heroku)
  }

  yield Utils.warnIfAtTeamMemberLimit(teamInfo, groupName, context, heroku)
}

let add = {
  topic: 'members',
  command: 'add',
  description: 'adds a user to a team',
  needsAuth: true,
  wantsOrg: true,
  args: [{ name: 'email' }],
  flags: [
    { name: 'role', char: 'r', hasValue: true, required: true, description: 'member role (admin, collaborator, member, owner)', completion: RoleCompletion },
    flags.team({ name: 'team', hasValue: true, hidden: true })
  ],
  run: cli.command(co.wrap(run))
}

module.exports = add
