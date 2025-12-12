import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

/**
 * Standard role description for consistent usage across commands
 */
export const ROLE_DESCRIPTION = 'member role (admin, collaborator, member, owner)'

/**
 * Check if team invite acceptance feature is enabled for a team
 */
export async function isTeamInviteFeatureEnabled(team: string, heroku: APIClient): Promise<boolean> {
  const {body: teamInfo} = await heroku.get<Heroku.Team>(`/teams/${team}`)
  
  if (teamInfo.type !== 'team') {
    return false
  }
  
  const {body: teamFeatures} = await heroku.get<Heroku.TeamFeature[]>(`/teams/${team}/features`)
  return teamFeatures.some(feature => feature.name === 'team-invite-acceptance' && feature.enabled)
}

/**
 * Get team invitations with proper headers
 */
export async function getTeamInvites(team: string, heroku: APIClient): Promise<Heroku.TeamInvitation[]> {
  const {body: teamInvites} = await heroku.get<Heroku.TeamInvitation[]>(
    `/teams/${team}/invitations`,
    {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations',
      },
    })
  return teamInvites
}
