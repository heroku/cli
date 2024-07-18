import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions'
import {addMemberToTeam} from '../../lib/members/utils'

export default class MembersSet extends Command {
  static topic = 'members'
  static description = 'sets a members role in a team'
  static strict = false
  static flags = {
    role: flags.string({char: 'r', required: true, description: 'member role (admin, collaborator, member, owner)', completion: RoleCompletion}),
    team: flags.team({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, argv} = await this.parse(MembersSet)
    const {role, team} = flags
    const email = argv[0] as string

    await addMemberToTeam(email, role, team, this.heroku, 'PATCH')
  }
}
