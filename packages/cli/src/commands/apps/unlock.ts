import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

export default class Unlock extends Command {
    static topic = 'apps'
    static description = 'unlock an app so any team member can join'
    static aliases = ['unlock']
    static flags = {
      app: flags.app({required: true}),
      remote: flags.remote(),
    }

    public async run(): Promise<void> {
      const {flags} = await this.parse(Unlock)
      const {app} = flags
      const {body: appResponse} = await this.heroku.get<Heroku.TeamApp>(`/teams/apps/${app}`)
      const appName = appResponse.name ?? app
      if (!appResponse.locked) {
        ux.error(`cannot unlock ${color.cyan(appName)}\nThis app is not locked.`, {exit: 1})
      }

      ux.action.start(`Unlocking ${color.cyan(appName)}`)
      await this.heroku.patch(
        `/teams/apps/${appName}`,
        {
          body: {locked: false},
        })
      ux.action.stop()
    }
}
