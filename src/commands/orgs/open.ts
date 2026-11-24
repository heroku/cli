import type {TeamWithDelinquency} from '@heroku/sdk/resources/platform/team'

import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {teamExtensions} from '@heroku/sdk/extensions/platform'

import {warnDelinquency} from '../../lib/delinquency.js'
import {createSDK} from '../../lib/sdk.js'

export default class OrgsOpen extends Command {
  static description = 'open the team interface in a browser window'
  static flags = {
    team: flags.team({required: true}),
  }
  static topic = 'orgs'

  public async run(): Promise<TeamWithDelinquency> {
    const {flags} = await this.parse(OrgsOpen)
    const {team} = flags
    const {platform} = createSDK(this.heroku, {extensions: [teamExtensions]})
    const result = await platform.team.getWithDelinquency(team)
    const {delinquency, team: org} = result
    warnDelinquency(this, 'team', delinquency)
    if (!await hux.openUrl(`https://dashboard.heroku.com/teams/${org.name}`, {prompt: false})) this.exit(1)

    return result
  }
}
