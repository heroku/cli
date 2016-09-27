'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let extend = require('util')._extend
let Utils = require('../../lib/utils')

function * run (context, heroku) {
  let orgInfo = yield Utils.orgInfo(context, heroku)
  let orgName = context.org

  const warnMembershipLimit = function * (totalMembers) {
    // Users receive `You'll be billed monthly for teams over 5 members.`
    const FREE_TEAM_LIMIT = 6
    if (totalMembers === FREE_TEAM_LIMIT) {
      cli.warn("You'll be billed monthly for teams over 5 members.")
    }
  }

  let addMemberToOrg = function * (email, role, orgName) {
    let request = heroku.request({
      method: 'PUT',
      path: `/organizations/${orgName}/members`,
      body: {email, role}
    })
    yield cli.action(`Adding ${cli.color.cyan(email)} to ${cli.color.magenta(orgName)} as ${cli.color.green(role)}`, request)
  }

  let inviteMemberToTeam = function * (email, role, orgName) {
    let request = heroku.request({
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations'
      },
      method: 'PUT',
      path: `/organizations/${orgName}/invitations`,
      body: {email, role}
    }).then(request => {
      cli.action.done('email sent')
    })

    yield cli.action(`Inviting ${cli.color.cyan(email)} to ${cli.color.magenta(orgName)} as ${cli.color.green(role)}`, request)
  }

  let email = context.args.email
  let role = context.flags.role

  let groupFeatures = yield heroku.get(`/organizations/${orgName}/features`)

  if (groupFeatures.filter(of => of.name === 'team-invite-acceptance').length) {
    yield inviteMemberToTeam(email, role, orgName)
  } else {
    yield addMemberToOrg(email, role, orgName)
  }

  if (orgInfo.type === 'team') {
    let membersAndInvites = yield co(function * () {
      return yield {
        invites: heroku.request({
          headers: {
            Accept: 'application/vnd.heroku+json; version=3.team-invitations'
          },
          method: 'GET',
          path: `/organizations/${orgName}/invitations`
        }),
        members: heroku.get(`/organizations/${orgName}/members`)
      }
    })
    const membersCount = membersAndInvites.invites.length + membersAndInvites.members.length
    yield warnMembershipLimit(membersCount)
  }
}

let cmd = {
  topic: 'members',
  command: 'add',
  description: 'adds a user to an organization',
  needsAuth: true,
  needsOrg: true,
  args: [{name: 'email'}],
  flags: [
    {name: 'role', char: 'r', hasValue: true, required: true, description: 'member role (admin, collaborator, member, owner)'}
  ],
  run: cli.command(co.wrap(run))
}

module.exports.add = cmd
module.exports.set = extend({}, cmd)
module.exports.set.command = 'set'
module.exports.set.description = 'sets a members role in an organization'
