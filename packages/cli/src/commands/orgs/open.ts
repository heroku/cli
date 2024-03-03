import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as open from 'open'
import {ux} from '@oclif/core'
import color from '@heroku-cli/color'

export default class Open extends Command {
    static topic = 'orgs';
    static description = 'open the team interface in a browser window';
    static flags = {
      team: flags.team({required: true}),
    };

    public static async openUrl(url: string): Promise<void> {
      ux.log(`Opening ${color.cyan(url)}...`)
      await open(url)
    }

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(Open)
      const team = flags.team
      const {body: org} = await this.heroku.get<Heroku.Team>(`/teams/${team}`)
      await Open.openUrl(`https://dashboard.heroku.com/teams/${org.name}`)
    }
}
