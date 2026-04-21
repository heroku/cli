import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {ux} from '@oclif/core/ux'
import open from 'open'

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
    const {body: org} = await this.heroku.get<Heroku.Team>(`/teams/${team}`)
    await OrgsOpen.openUrl(`https://dashboard.heroku.com/teams/${org.name}`)
  }
}
