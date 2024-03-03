import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as open from 'open'

export default class Open extends Command {
    static topic = 'orgs';
    static description = 'open the team interface in a browser window';
    static flags = {
      team: flags.team(),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(Open)
      const team = flags.team
      if (!team)
        throw new Error('No team specified')
      const {body: org} = await this.heroku.get<Heroku.Team>(`/teams/${team}`)
      await open(`https://dashboard.heroku.com/teams/${org.name}`)
    }
}
