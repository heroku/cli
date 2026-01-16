import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class AppsJoin extends Command {
  static aliases = ['join']
  static description = 'add yourself to a team app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
  }

  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(AppsJoin)
    const {app} = flags
    ux.action.start(`Joining ${color.app(app)}`)
    const {body: user} = await this.heroku.get<Heroku.Account>('/account')
    await this.heroku.post<Heroku.TeamAppCollaborator>(`/teams/apps/${app}/collaborators`, {
      body: {user: user.email},
    })
    ux.action.stop()
  }
}
