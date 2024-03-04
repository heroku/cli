import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

const revokeInvite = async (email: string, team: string, heroku: APIClient) => {
  ux.action.start(`Revoking invite for ${color.cyan(email)} in ${color.magenta(team)}`)
  await heroku.delete<Heroku.TeamInvitation[]>(
    `/teams/${team}/invitations/${email}`,
    {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations',
      },
    })
  ux.action.stop()
}

const getTeamInvites = async (team: string, heroku: APIClient) => {
  const {body: teamInvites} = await heroku.get<Heroku.TeamInvitation[]>(
    `/teams/${team}/invitations`,
    {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations',
      },
    })
  return teamInvites
}

const removeUserMembership = async (email:string, team: string, heroku: APIClient) => {
  ux.action.start(`Removing ${color.cyan(email)} from ${color.magenta(team)}`)
  await heroku.delete(`/teams/${team}/members/${encodeURIComponent(email)}`)
  ux.action.stop()
}

export default class MembersRemove extends Command {
  static topic = 'members';
  static description = 'removes a user from a team';
  static flags = {
    team: flags.team({required: true}),
  };

  static strict = false

  public async run(): Promise<void> {
    const {flags, argv} = await this.parse(MembersRemove)
    const {team} = flags
    const email = argv[0] as string
    const {body: teamInfo} = await this.heroku.get<Heroku.Team>(`/teams/${team}`)
    let teamInviteFeatureEnabled = false
    let isInvitedUser = false

    if (teamInfo.type === 'team') {
      const {body: teamFeatures} = await this.heroku.get<Heroku.TeamFeature[]>(`/teams/${team}/features`)
      teamInviteFeatureEnabled = Boolean(teamFeatures.some(feature => feature.name === 'team-invite-acceptance' && feature.enabled))
      if (teamInviteFeatureEnabled) {
        const invites = await getTeamInvites(team, this.heroku)
        isInvitedUser = Boolean(invites.some(m => m.user?.email === email))
      }
    }

    if (teamInviteFeatureEnabled && isInvitedUser) {
      await revokeInvite(email, team, this.heroku)
    } else {
      await removeUserMembership(email, team, this.heroku)
    }
  }
}
