import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Index extends Command {
  static topic = 'teams';
  static description = `list the teams that you are a member of\n\nUse ${color.cyan.bold('heroku members:*')} to manage team members.`;
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {body: teams} = await this.heroku.get<Heroku.Team[]>('/teams')

    if (flags.json)
      ux.styledJSON(teams)
    else {
      ux.table(teams.sort((a: Heroku.Team, b: Heroku.Team) => {
        const aName = a?.name || ''
        const bName = b?.name || ''
        return (aName > bName) ? 1 : ((bName > aName) ? -1 : 0)
      }), {
        name: {header: 'Team'},
        role: {header: 'Role',  get: ({role}) => color.green(role || '')},
      })
    }
  }
}
