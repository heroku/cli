import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import {isTeamInviteFeatureEnabled, getTeamInvites} from '../../lib/members/team-invite-utils.js'

type MemberWithStatus = Heroku.TeamMember & { status?: string }

const buildTableColumns = (teamInvites: MemberWithStatus[]) => {
  const baseColumns = {
    email: {
      get: ({email}: any): string => color.cyan(email),
    },
    role: {
      get: ({role}: any): string => color.green(role),
    },
  }

  if (teamInvites.length > 0) {
    return {
      ...baseColumns,
      status: {
        get: ({status}: any): string => color.green(status),
      },
    }
  }

  return baseColumns
}

export default class MembersIndex extends Command {
  static topic = 'members'
  static description = 'list members of a team'

  static flags = {
    role: flags.string({
      char: 'r',
      description: 'filter by role',
      completion: RoleCompletion,
    }),
    pending: flags.boolean({description: 'filter by pending team invitations'}),
    json: flags.boolean({description: 'output in json format'}),
    team: flags.team({required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MembersIndex)
    const {role, pending, json, team} = flags
    let teamInvites: MemberWithStatus[] = []

    if (await isTeamInviteFeatureEnabled(team, this.heroku)) {
      const invites = await getTeamInvites(team, this.heroku)
      teamInvites = invites.map((invite: Heroku.TeamInvitation): MemberWithStatus => ({
        email: invite.user?.email || '',
        role: invite.role,
        status: 'pending',
        federated: false,
        user: invite.user,
        two_factor_authentication: false,
        created_at: invite.created_at || '',
        updated_at: invite.updated_at || '',
      }))
    }

    let {body: members} = await this.heroku.get<MemberWithStatus[]>(`/teams/${team}/members`)
    // Set status '' to all existing members
    members.forEach((member: MemberWithStatus) => {
      member.status = ''
    })

    members = [...members, ...teamInvites].sort((a, b) => a.email.localeCompare(b.email))

    if (role)
      members = members.filter(m => m.role === role)
    if (pending)
      members = members.filter(m => m.status === 'pending')

    if (json) {
      ux.stdout(JSON.stringify(members, null, 3))
    } else if (members.length === 0) {
      let msg = `No members in ${color.magenta(team || '')}`
      if (role)
        msg += ` with role ${color.green(role)}`
      ux.stdout(msg)
    } else {
      const tableColumns = buildTableColumns(teamInvites)
      hux.table(
        members,
        tableColumns,
      )
    }
  }
}
