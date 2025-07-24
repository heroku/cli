import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {printGroups, printGroupsJSON} from '../../lib/orgs/utils.js'

export default class OrgsIndex extends Command {
  static topic = 'orgs'
  static description = 'list the teams that you are a member of'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    enterprise: flags.boolean({description: 'filter by enterprise teams'}),
    teams: flags.boolean({description: 'filter by teams', hidden: true}),
  }

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
