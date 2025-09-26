import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import {addMemberToTeam} from '../../lib/members/utils.js'
import {ROLE_DESCRIPTION} from '../../lib/members/team-invite-utils.js'

export default class MembersSet extends Command {
  static topic = 'members'
  static description = 'sets a members role in a team'
  static strict = false
  
  static flags = {
    role: flags.string({
      char: 'r', 
      required: true, 
      description: ROLE_DESCRIPTION, 
      completion: RoleCompletion,
    }),
    team: flags.team({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, argv} = await this.parse(MembersSet)
    const {role, team} = flags
    const email = argv[0] as string

    await addMemberToTeam(email, role, team, this.heroku, 'PATCH')
  }
}
