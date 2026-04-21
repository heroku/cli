import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import {printGroups, printGroupsJSON} from '../../lib/orgs/utils.js'

export default class OrgsIndex extends Command {
  static description = 'list the teams that you are a member of'
  static flags = {
    enterprise: flags.boolean({description: 'filter by enterprise teams'}),
    json: flags.boolean({description: 'output in json format'}),
    teams: flags.boolean({description: 'filter by teams', hidden: true}),
  }
  static topic = 'orgs'

  public async run(): Promise<void> {
    const {flags} = await this.parse(OrgsIndex)
    let {body: orgs} = await this.heroku.get<Heroku.Team[]>('/teams')
    if (flags.enterprise) {
      orgs = orgs.filter(o => o.type === 'enterprise')
    }

    if (flags.json) {
      printGroupsJSON(orgs)
    } else {
      printGroups(orgs, {label: 'Teams'})
    }
  }
}
