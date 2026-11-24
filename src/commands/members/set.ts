import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'

import {ROLE_DESCRIPTION} from '../../lib/members/constants.js'
import {createSDK} from '../../lib/sdk.js'

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

  public async run() {
    const {argv, flags} = await this.parse(MembersSet)
    const {role, team} = flags
    const email = argv[0] as string
    const {platform} = createSDK(this.heroku)

    ux.action.start(`Adding ${color.user(email)} to ${color.team(team)} as ${color.green(role)}`)
    const member = await platform.teamMember.update(team, {email, role: role as Parameters<typeof platform.teamMember.update>[1]['role']})
    ux.action.stop()
    return member
  }
}
