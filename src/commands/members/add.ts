import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import {Args} from '@oclif/core'

import {isTeamInviteFeatureEnabled, ROLE_DESCRIPTION} from '../../lib/members/team-invite-utils.js'
import {addMemberToTeam, inviteMemberToTeam} from '../../lib/members/util.js'

export default class MembersAdd extends Command {
  static args = {
    email: Args.string({description: 'email address of the team member', required: true}),
  }
  static description = 'adds a user to a team'
  static flags = {
    role: flags.string({
      char: 'r',
      completion: RoleCompletion,
      description: ROLE_DESCRIPTION,
      required: true,
    }),
    team: flags.team({required: true}),
  }
  static topic = 'members'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(MembersAdd)
    const {role, team} = flags
    const {email} = args

    const teamInviteEnabled = await isTeamInviteFeatureEnabled(team, this.heroku)
    if (teamInviteEnabled) {
      await inviteMemberToTeam(email, role, team, this.heroku)
    } else {
      await addMemberToTeam(email, role, team, this.heroku)
    }
  }
}
