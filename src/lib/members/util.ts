import {color} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export const inviteMemberToTeam = async function (email: string, role: string, team: string, heroku: APIClient) {
  ux.action.start(`Inviting ${color.user(email)} to ${color.team(team)} as ${color.green(role)}`)
  await heroku.request<Heroku.TeamInvitation[]>(
    `/teams/${team}/invitations`,
    {
      body: {email, role}, headers: {
        Accept: 'application/vnd.heroku+json; version=3.team-invitations',
      },
      method: 'PUT',
    })
  ux.action.stop()
}

export const addMemberToTeam = async function (email: string, role: string, groupName: string, heroku: APIClient, method = 'PUT') {
  ux.action.start(`Adding ${color.user(email)} to ${color.team(groupName)} as ${color.green(role)}`)
  await heroku.request<Heroku.TeamMember[]>(
    `/teams/${groupName}/members`,
    {
      body: {email, role},
      method,
    })
  ux.action.stop()
}
