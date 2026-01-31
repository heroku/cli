import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class AppsLock extends Command {
  static aliases = ['lock']
  static description = 'prevent team members from joining an app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'apps'

  public async run(): Promise<void> {
    const {flags} = await this.parse(AppsLock)
    const {app} = flags
    const {body: appResponse} = await this.heroku.get<Heroku.TeamApp>(`/teams/apps/${app}`)
    const appName = appResponse.name ?? app
    if (appResponse.locked) {
      throw new Error(`Error: cannot lock ${color.app(appName)}.\nThis app is already locked.`)
    }

    ux.action.start(`Locking ${color.app(appName)}`)

    await this.heroku.patch(
      `/teams/apps/${appName}`,
      {
        body: {locked: true},
      })
    ux.action.stop()
  }
}
