import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'

export const inviteMemberToTeam = async function (email: string, role: string, team: string, heroku: APIClient) {
  ux.action.start(`Inviting ${color.cyan(email)} to ${color.magenta(team)} as ${color.green(role)}`)
  await heroku.request<Heroku.TeamInvitation[]>(
    `/teams/${team}/invitations`,
    {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations',
      }, method: 'PUT',
      body: {email, role},
    })
  ux.action.stop()
}

export const addMemberToTeam = async function (email: string, role: string, groupName: string, heroku: APIClient, method = 'PUT') {
  ux.action.start(`Adding ${color.cyan(email)} to ${color.magenta(groupName)} as ${color.green(role)}`)
  await heroku.request<Heroku.TeamMember[]>(
    `/teams/${groupName}/members`,
    {
      method: method,
      body: {email, role},
    })
  ux.action.stop()
}
