'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let Utils = require('../../lib/utils')
const { flags } = require('@heroku-cli/command')

function * run (context, heroku) {
  let teamInfo = yield Utils.teamInfo(context, heroku)
  let groupName = context.org || context.team || context.flags.team
  let teamInviteFeatureEnabled = false
  let isInvitedUser = false
  let email = context.args.email

  let teamInvites = function * () {
    return heroku.request({
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations'
      },
      method: 'GET',
      path: `/teams/${groupName}/invitations`
    })
  }

  let revokeInvite = function * () {
    let request = heroku.request({
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations'
      },
      method: 'DELETE',
      path: `/teams/${groupName}/invitations/${email}`
    })
    yield cli.action(`Revoking invite for ${cli.color.cyan(email)} in ${cli.color.magenta(groupName)}`, request)
  }

  let removeUserMembership = function * () {
    let request = heroku.delete(`/teams/${groupName}/members/${encodeURIComponent(email)}`)
    yield cli.action(`Removing ${cli.color.cyan(email)} from ${cli.color.magenta(groupName)}`, request)
  }

  if (teamInfo.type === 'team') {
    let teamFeatures = yield heroku.get(`/teams/${groupName}/features`)
    teamInviteFeatureEnabled = !!teamFeatures.find(feature => feature.name === 'team-invite-acceptance' && feature.enabled)

    if (teamInviteFeatureEnabled) {
      let invites = yield teamInvites()
      isInvitedUser = !!invites.find(m => m.user.email === email)
    }
  }

  if (teamInviteFeatureEnabled && isInvitedUser) {
    yield revokeInvite()
  } else {
    yield removeUserMembership()
  }

  Utils.warnUsingOrgFlagInTeams(teamInfo, context)
}

module.exports = {
  topic: 'members',
  command: 'remove',
  description: 'removes a user from a team',
  needsAuth: true,
  wantsOrg: true,
  args: [{ name: 'email' }],
  flags: [
    flags.team({ name: 'team', hasValue: true, hidden: true })
  ],
  run: cli.command(co.wrap(run))
}
