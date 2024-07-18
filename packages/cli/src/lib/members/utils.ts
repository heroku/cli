import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'

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
