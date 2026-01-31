import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

export default class Index extends Command {
  static description = `list the teams that you are a member of\n\nUse ${color.code('heroku members:*')} to manage team members.`
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }

  static topic = 'teams'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {body: teams} = await this.heroku.get<Heroku.Team[]>('/teams')

    if (flags.json)
      hux.styledJSON(teams)
    else {
      hux.table(teams.sort((a: Heroku.Team, b: Heroku.Team) => {
        const aName = a?.name || ''
        const bName = b?.name || ''
        return (aName > bName) ? 1 : ((bName > aName) ? -1 : 0)
      }), {
        name: {header: 'Team'},
        role: {get: ({role}) => color.info(role || ''),  header: 'Role'},
      })
    }
  }
}
