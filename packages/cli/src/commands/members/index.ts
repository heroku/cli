import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

const _ = require('lodash')
const Utils = require('../../lib/utils')
export default class MembersIndex extends Command {
    static topic = 'members';
    static description = 'list members of a team';
    static flags = {
      role: flags.string({char: 'r', description: 'filter by role', completion: RoleCompletion}),
      pending: flags.boolean({description: 'filter by pending team invitations'}),
      json: flags.boolean({description: 'output in json format'}),
      team: flags.team(),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(MembersIndex)
      const teamInfo = await teamInfo(context, this.heroku)
      const groupName = flags.team
      let teamInvites: Heroku.TeamInvitation[] = []
      if (teamInfo.type === 'team') {
        const orgFeatures = await this.heroku.get<Heroku.TeamFeature[]>(`/teams/${groupName}/features`)
        if (orgFeatures.find(feature => feature.name === 'team-invite-acceptance' && feature.enabled)) {
          const invitesResponse = await this.heroku.get<Heroku.TeamInvitation[]>(
            `/teams/${groupName}/invitations`,
            {headers: {
              Accept: 'application/vnd.heroku+json; version=3.team-invitations',
            },
            })
          teamInvites = _.map(invitesResponse.body, function (invite: Heroku.TeamInvitation) {
            return {email: invite.user?.email, role: invite.role, status: 'pending'}
          })
        }
      }

      let {body: members} = await this.heroku.get<Heroku.TeamMember[]>(`/teams/${groupName}/members`)
      _.map(members, (member: { status: string }) => {
        member.status = ''
      })
      members = _.sortBy(_.union(members, teamInvites), 'email')
      if (flags.role)
        members = members.filter(m => m.role === flags.role)
      if (flags.pending)
        members = members.filter(m => m.status === 'pending')
      if (flags.json) {
        ux.log(JSON.stringify(members, null, 3))
      } else if (members.length === 0) {
        let msg = `No members in ${color.magenta(groupName)}`
        if (flags.role)
          msg += ` with role ${color.green(flags.role)}`
        ux.log(msg)
      } else {
        cli.table(members, {
          printHeader: false, columns: [
            {key: 'email', label: 'Email', format: e => color.cyan(e)}, {key: 'role', label: 'Role', format: r => color.green(r)}, {key: 'status', label: 'Status', format: r => color.green(r)},
          ],
        })
      }
    }
}
