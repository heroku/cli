import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {RoleCompletion} from '@heroku-cli/command/lib/completions'
import {addMemberToTeam, inviteMemberToTeam} from '../../lib/members/util'
export default class MembersAdd extends Command {
    static topic = 'members';
    static description = 'adds a user to a team';
    static flags = {
      role: flags.string({char: 'r', required: true, description: 'member role (admin, collaborator, member, owner)', completion: RoleCompletion}),
      team: flags.team({required: true}),
    };

    static args = {
      email: Args.string({required: true, description: 'email address of the team member'}),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(MembersAdd)
      const {team, role} = flags
      const {body: teamInfo} = await this.heroku.get<Heroku.Team>(`/teams/${team}`)
      const email = args.email
      const {body: groupFeatures} = await this.heroku.get<Heroku.TeamFeature[]>(`/teams/${team}/features`)

      if (teamInfo.type === 'team' && groupFeatures.some(feature => {
        return feature.name === 'team-invite-acceptance' && feature.enabled
      })) {
        await inviteMemberToTeam(email, role, team, this.heroku)
      } else {
        await addMemberToTeam(email, role, team, this.heroku)
      }
    }
}
