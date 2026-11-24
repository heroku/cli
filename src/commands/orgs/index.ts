import type {Team} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'

import {printGroups, printGroupsJSON} from '../../lib/orgs/utils.js'
import {createSDK} from '../../lib/sdk.js'

export default class OrgsIndex extends Command {
  static description = 'list the teams that you are a member of'
  static flags = {
    enterprise: flags.boolean({description: 'filter by enterprise teams'}),
    json: flags.boolean({description: 'output in json format'}),
    teams: flags.boolean({description: 'filter by teams', hidden: true}),
  }
  static topic = 'orgs'

  public async run(): Promise<Team[]> {
    const {platform} = createSDK(this.heroku)
    const {flags} = await this.parse(OrgsIndex)
    let orgs = await platform.team.list()
    if (flags.enterprise) {
      orgs = orgs.filter(o => o.type === 'enterprise')
    }

    if (flags.json) {
      printGroupsJSON(orgs)
    } else {
      printGroups(orgs, {label: 'Teams'})
    }

    return orgs
  }
}
