import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import open from 'open'
import {ux} from '@oclif/core'

export default class OrgsOpen extends Command {
  static topic = 'orgs'
  static description = 'open the team interface in a browser window'
  static flags = {
    team: flags.team({required: true}),
  }

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
