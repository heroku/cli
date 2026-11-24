import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import {color, hux} from '@heroku/heroku-cli-util'
import {teamMemberExtensions, type TeamMemberWithStatus} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {createSDK} from '../../lib/sdk.js'

const buildTableColumns = (teamInvites: TeamMemberWithStatus[]) => {
  const baseColumns = {
    email: {
      get: ({email}: {email: string}): string => color.user(email),
    },
    role: {
      get: ({role}: TeamMemberWithStatus): string => color.info(role as string),
    },
  }

  if (teamInvites.length > 0) {
    return {
      ...baseColumns,
      status: {
        get({status}: TeamMemberWithStatus): string {
          if (status === 'pending') return color.warning(status)
          return color.success(status)
        },
      },
    }
  }

  return baseColumns
}

export default class MembersIndex extends Command {
  static description = 'list members of a team'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    pending: flags.boolean({description: 'filter by pending team invitations'}),
    role: flags.string({
      char: 'r',
      completion: RoleCompletion,
      description: 'filter by role',
    }),
    team: flags.team({required: true}),
  }
  static topic = 'members'

  public async run(): Promise<TeamMemberWithStatus[]> {
    const {flags} = await this.parse(MembersIndex)
    const {json, pending, role, team} = flags
    const {platform} = createSDK(this.heroku, {extensions: [teamMemberExtensions]})
    const allMembers = await platform.teamMember.listWithInvitations(team)
    let members = allMembers

    if (role)
      members = members.filter(m => m.role === role)
    if (pending)
      members = members.filter(m => m.status === 'pending')

    if (json) {
      ux.stdout(JSON.stringify(members, null, 3))
    } else if (members.length === 0) {
      let msg = `No members in ${color.team(team || '')}`
      if (role)
        msg += ` with role ${color.info(role)}`
      ux.stdout(msg)
    } else {
      const tableColumns = buildTableColumns(allMembers.filter(member => member.status === 'pending'))
      this.log(hux.table(
        members,
        tableColumns,
      ))
    }

    return members
  }
}
