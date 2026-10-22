import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {formatDelinquencyWarning, teamExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'
import open from 'open'

import {createSDK} from '../../lib/sdk.js'

export default class OrgsOpen extends Command {
  static description = 'open the team interface in a browser window'
  static flags = {
    team: flags.team({required: true}),
  }
  static topic = 'orgs'

  public static async openUrl(url: string): Promise<void> {
    ux.stdout(`Opening ${color.info(url)}...`)
    await open(url)
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(OrgsOpen)
    const {team} = flags
    const {platform} = createSDK(this.heroku, {extensions: [teamExtensions]})
    const {delinquency, team: org} = await platform.team.getWithDelinquency(team)
    const delinquencyWarning = formatDelinquencyWarning('team', delinquency)
    if (delinquencyWarning) this.warn(delinquencyWarning)
    await OrgsOpen.openUrl(`https://dashboard.heroku.com/teams/${org.name}`)
  }
}
