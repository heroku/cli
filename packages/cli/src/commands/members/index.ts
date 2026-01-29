import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

import {getTeamInvites, isTeamInviteFeatureEnabled} from '../../lib/members/team-invite-utils.js'

type MemberWithStatus = { status?: string } & Heroku.TeamMember

const buildTableColumns = (teamInvites: MemberWithStatus[]) => {
  const baseColumns = {
    email: {
      get: ({email}: any): string => color.user(email),
    },
    role: {
      get: ({role}: any): string => color.info(role),
    },
  }

  if (teamInvites.length > 0) {
    return {
      ...baseColumns,
      status: {
        get({status}: any): string {
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

  public async run(): Promise<void> {
    const {flags} = await this.parse(MembersIndex)
    const {json, pending, role, team} = flags
    let teamInvites: MemberWithStatus[] = []

    if (await isTeamInviteFeatureEnabled(team, this.heroku)) {
      const invites = await getTeamInvites(team, this.heroku)
      /* eslint-disable perfectionist/sort-objects */
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
      /* eslint-enable perfectionist/sort-objects */
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
      let msg = `No members in ${color.team(team || '')}`
      if (role)
        msg += ` with role ${color.info(role)}`
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
