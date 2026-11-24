import {Command, flags} from '@heroku-cli/command'
import {RoleCompletion} from '@heroku-cli/command/lib/completions.js'
import * as color from '@heroku/heroku-cli-util/color'
import {type AddOrInviteResult, teamMemberExtensions} from '@heroku/sdk/extensions/platform'
import {Args} from '@oclif/core'
import {ux} from '@oclif/core/ux'

import {ROLE_DESCRIPTION} from '../../lib/members/constants.js'
import {createSDK} from '../../lib/sdk.js'

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

  public async run(): Promise<AddOrInviteResult> {
    const {args, flags} = await this.parse(MembersAdd)
    const {role, team} = flags
    const {email} = args
    const {platform} = createSDK(this.heroku, {extensions: [teamMemberExtensions]})

    const result = await platform.teamMember.addOrInvite(team, email, role, {
      beforeMutation({kind}) {
        const action = kind === 'invitation' ? 'Inviting' : 'Adding'
        ux.action.start(`${action} ${color.user(email)} to ${color.team(team)} as ${color.green(role)}`)
      },
    })
    ux.action.stop()
    return result
  }
}
