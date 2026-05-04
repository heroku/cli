import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'

import {ROLE_DESCRIPTION} from '../../lib/members/team-invite-utils.js'
import {addMemberToTeam} from '../../lib/members/util.js'

export default class MembersSet extends Command {
  static description = 'sets a members role in a team'
  static flags = {
    role: flags.string({
      char: 'r',
      completion: RoleCompletion,
      description: ROLE_DESCRIPTION,
      required: true,
    }),
    team: flags.team({required: true}),
  }
  static strict = false
  static topic = 'members'

  public async run(): Promise<void> {
    const {argv, flags} = await this.parse(MembersSet)
    const {role, team} = flags
    const email = argv[0] as string

    await addMemberToTeam(email, role, team, this.heroku, 'PATCH')
  }
}
