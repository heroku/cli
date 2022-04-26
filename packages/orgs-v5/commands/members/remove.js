'use strict'

let cli = require('heroku-cli-util')
let Utils = require('../../lib/utils')
const { flags } = require('@heroku-cli/command')

async function run(context, heroku) {
  let teamInfo = await Utils.teamInfo(context, heroku)
  let groupName = context.flags.team
  let teamInviteFeatureEnabled = false
  let isInvitedUser = false
  let email = context.args.email

  let teamInvites = async function () {
    return heroku.request({
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations'
      },
      method: 'GET',
      path: `/teams/${groupName}/invitations`
    })
  }

  let revokeInvite = async function () {
    let request = heroku.request({
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations'
      },
      method: 'DELETE',
      path: `/teams/${groupName}/invitations/${email}`
    })
    await cli.action(`Revoking invite for ${cli.color.cyan(email)} in ${cli.color.magenta(groupName)}`, request)
  }

  let removeUserMembership = async function () {
    let request = heroku.delete(`/teams/${groupName}/members/${encodeURIComponent(email)}`)
    await cli.action(`Removing ${cli.color.cyan(email)} from ${cli.color.magenta(groupName)}`, request)
  }

  if (teamInfo.type === 'team') {
    let teamFeatures = await heroku.get(`/teams/${groupName}/features`)
    teamInviteFeatureEnabled = !!teamFeatures.find(feature => feature.name === 'team-invite-acceptance' && feature.enabled)

    if (teamInviteFeatureEnabled) {
      let invites = await teamInvites()
      isInvitedUser = !!invites.find(m => m.user.email === email)
    }
  }

  if (teamInviteFeatureEnabled && isInvitedUser) {
    await revokeInvite()
  } else {
    await removeUserMembership()
  }
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
  run: cli.command(run)
}
