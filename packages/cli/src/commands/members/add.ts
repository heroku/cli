import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import {addMemberToTeam, inviteMemberToTeam} from '../../lib/members/util.js'
import {isTeamInviteFeatureEnabled, ROLE_DESCRIPTION} from '../../lib/members/team-invite-utils.js'

export default class MembersAdd extends Command {
  static topic = 'members'
  static description = 'adds a user to a team'
  
  static flags = {
    role: flags.string({
      char: 'r', 
      required: true, 
      description: ROLE_DESCRIPTION, 
      completion: RoleCompletion,
    }),
    team: flags.team({required: true}),
  }

  static args = {
    email: Args.string({required: true, description: 'email address of the team member'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(MembersAdd)
    const {team, role} = flags
    const email = args.email

    if (await isTeamInviteFeatureEnabled(team, this.heroku)) {
      await inviteMemberToTeam(email, role, team, this.heroku)
    } else {
      await addMemberToTeam(email, role, team, this.heroku)
    }
  }
}
