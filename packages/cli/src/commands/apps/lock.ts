import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class AppsLock extends Command {
    static topic = 'apps'
    static description = 'prevent team members from joining an app';
    static flags = {
      app: flags.app({required: true}),
      remote: flags.remote(),
    };

    public async run(): Promise<void> {
      const {flags} = await this.parse(AppsLock)
      const {app} = flags
      const {body: appResponse} = await this.heroku.get<Heroku.TeamApp>(`/teams/apps/${app}`)
      const appName = appResponse.name ?? app
      if (appResponse.locked) {
        throw new Error(`Error: cannot lock ${color.cyan(appName)}.\nThis app is already locked.`)
      }

      ux.action.start(`Locking ${color.cyan(appName)}`)

      await this.heroku.patch(
        `/teams/apps/${appName}`,
        {
          body: {locked: true},
        })
      ux.action.stop()
    }
}
