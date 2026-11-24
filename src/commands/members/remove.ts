import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

const revokeInvite = async (email: string, team: string, platform: ReturnType<typeof createSDK>['platform']) => {
  ux.action.start(`Revoking invite for ${color.user(email)} in ${color.team(team)}`)
  const invitation = await platform.withHeaders({Accept: 'application/vnd.heroku+json; version=3.team-invitations'})
    .teamInvitation.revoke(team, email)
  ux.action.stop()
  return invitation
}

const removeUserMembership = async (email: string, team: string, platform: ReturnType<typeof createSDK>['platform']) => {
  ux.action.start(`Removing ${color.user(email)} from ${color.team(team)}`)
  const member = await platform.teamMember.delete(team, email)
  ux.action.stop()
  return member
}

export default class MembersRemove extends Command {
  static description = 'removes a user from a team'
  static flags = {
    team: flags.team({required: true}),
  }
  static strict = false
  static topic = 'members'

  public async run() {
    const {argv, flags} = await this.parse(MembersRemove)
    const {team} = flags
    const email = argv[0] as string
    const {platform} = createSDK(this.heroku)
    const teamInfo = await platform.team.info(team)
    let isInvitedUser = false

    if (teamInfo.type === 'team') {
      const features = await platform.teamFeature.list(team)
      const teamInviteFeatureEnabled = features.some(feature => feature.name === 'team-invite-acceptance' && feature.enabled)

      if (teamInviteFeatureEnabled) {
        const invites = await platform.withHeaders({Accept: 'application/vnd.heroku+json; version=3.team-invitations'})
          .teamInvitation.list(team)
        isInvitedUser = Boolean(invites.some(m => m.user?.email === email))
      }
    }

    if (isInvitedUser) {
      return revokeInvite(email, team, platform)
    }

    return removeUserMembership(email, team, platform)
  }
}
