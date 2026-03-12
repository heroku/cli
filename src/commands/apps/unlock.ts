import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class Unlock extends Command {
  static aliases = ['unlock']
  static description = 'unlock an app so any team member can join'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Unlock)
    const {app} = flags
    const {body: appResponse} = await this.heroku.get<Heroku.TeamApp>(`/teams/apps/${app}`)
    const appName = appResponse.name ?? app
    if (!appResponse.locked) {
      ux.error(`cannot unlock ${color.app(appName)}\nThis app is not locked.`, {exit: 1})
    }

    ux.action.start(`Unlocking ${color.app(appName)}`)
    await this.heroku.patch(
      `/teams/apps/${appName}`,
      {
        body: {locked: false},
      })
    ux.action.stop()
  }
}
