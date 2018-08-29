'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let Utils = require('../../lib/utils')
const { flags } = require('@heroku-cli/command')
const { RoleCompletion } = require('@heroku-cli/command/lib/completions')

function * run (context, heroku) {
  let orgInfo = yield Utils.orgInfo(context, heroku)
  let groupName = context.org || context.team || context.flags.team
  let email = context.args.email
  let role = context.flags.role
  let groupFeatures = yield heroku.get(`/organizations/${groupName}/features`)

  let inviteMemberToTeam = function * (email, role, groupName) {
    let request = heroku.request({
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations'
      },
      method: 'PUT',
      path: `/organizations/${groupName}/invitations`,
      body: { email, role }
    }).then(request => {
      cli.action.done('email sent')
    })

    yield cli.action(`Inviting ${cli.color.cyan(email)} to ${cli.color.magenta(groupName)} as ${cli.color.green(role)}`, request)
  }

  if (orgInfo.type === 'team' && groupFeatures.find(feature => { return feature.name === 'team-invite-acceptance' && feature.enabled })) {
    yield inviteMemberToTeam(email, role, groupName)
  } else {
    yield Utils.addMemberToOrg(email, role, groupName, heroku)
  }

  yield Utils.warnIfAtTeamMemberLimit(orgInfo, groupName, context, heroku)
  Utils.warnUsingOrgFlagInTeams(orgInfo, context)
}

let add = {
  topic: 'members',
  command: 'add',
  description: 'adds a user to an organization or a team',
  needsAuth: true,
  wantsOrg: true,
  args: [{ name: 'email' }],
  flags: [
    { name: 'role', char: 'r', hasValue: true, required: true, description: 'member role (admin, collaborator, member, owner)', completion: RoleCompletion },
    // flags.org({name: 'org', hasValue: true, description: 'org to use', hidden: false}),
    flags.team({ name: 'team', hasValue: true, hidden: true })
  ],
  run: cli.command(co.wrap(run))
}

module.exports = add
