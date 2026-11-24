import type {Team} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'

import {createSDK} from '../../lib/sdk.js'

export default class Index extends Command {
  static description = `list the teams that you are a member of\n\nUse ${color.code('heroku members:*')} to manage team members.`
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
  }
  static topic = 'teams'

  public async run(): Promise<Team[]> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(Index)
    const teams = await platform.team.list()

    if (flags.json)
      this.logJson(teams)
    else {
      const sortedTeams = [...teams].sort((a, b) => {
        const aName = a?.name || ''
        const bName = b?.name || ''
        return (aName > bName) ? 1 : ((bName > aName) ? -1 : 0)
      }).map(({name, role}) => ({name, role}))

      this.log(hux.table(sortedTeams, {
        name: {header: 'Team'},
        role: {get: ({role}) => color.info(role || ''),  header: 'Role'},
      }))
    }

    return teams
  }
}
