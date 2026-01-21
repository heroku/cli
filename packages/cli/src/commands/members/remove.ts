import {color} from '@heroku/heroku-cli-util'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {isTeamInviteFeatureEnabled, getTeamInvites} from '../../lib/members/team-invite-utils.js'

const revokeInvite = async (email: string, team: string, heroku: APIClient) => {
  ux.action.start(`Revoking invite for ${color.user(email)} in ${color.team(team)}`)
  await heroku.delete<Heroku.TeamInvitation[]>(
    `/teams/${team}/invitations/${email}`,
    {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations',
      },
    })
  ux.action.stop()
}

const removeUserMembership = async (email: string, team: string, heroku: APIClient) => {
  ux.action.start(`Removing ${color.user(email)} from ${color.team(team)}`)
  await heroku.delete(`/teams/${team}/members/${encodeURIComponent(email)}`)
  ux.action.stop()
}

export default class MembersRemove extends Command {
  static topic = 'members'
  static description = 'removes a user from a team'

  static flags = {
    team: flags.team({required: true}),
  }

  static strict = false

  public async run(): Promise<void> {
    const {flags, argv} = await this.parse(MembersRemove)
    const {team} = flags
    const email = argv[0] as string
    const teamInviteFeatureEnabled = await isTeamInviteFeatureEnabled(team, this.heroku)
    let isInvitedUser = false

    if (teamInviteFeatureEnabled) {
      const invites = await getTeamInvites(team, this.heroku)
      isInvitedUser = Boolean(invites.some(m => m.user?.email === email))
    }

    if (teamInviteFeatureEnabled && isInvitedUser) {
      await revokeInvite(email, team, this.heroku)
    } else {
      await removeUserMembership(email, team, this.heroku)
    }
  }
}
