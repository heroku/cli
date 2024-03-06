import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class AppsJoin extends Command {
    static topic = 'apps';
    static description = 'add yourself to a team app';
    static aliases = ['join']
    static flags = {
      app: flags.app({required: true}),
      remote: flags.remote({char: 'r'}),
    };

    public async run(): Promise<void> {
      const {flags, argv, args} = await this.parse(AppsJoin)
      const {app} = flags
      ux.action.start(`Joining ${color.cyan(app)}`)
      const {body: user} = await this.heroku.get<Heroku.Account>('/account')
      await this.heroku.post<Heroku.TeamAppCollaborator[]>(`/teams/apps/${app}/collaborators`, {
        body: {user: user.email},
      })
      ux.action.stop()
    }
}
