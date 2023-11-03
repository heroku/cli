import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {uniq} from 'lodash'
import confirmApp from '../../lib/apps/confirm-app'
import * as git from '../../lib/ci/git'

export default class Destroy extends Command {
  static description = 'permanently destroy an app'
  static help = 'This will also destroy all add-ons on the app.'
  static aliases = ['destroy', 'apps:delete']
  static flags = {
    app: flags.app(),
    confirm: flags.string({char: 'c'}),
  }

  static args = {
    app: Args.string({hidden: true}),
  }

  async run() {
    const {flags, args} = await this.parse(Destroy)

    const app = args.app || flags.app
    if (!app) throw new Error('No app specified.\nUSAGE: heroku apps:destroy APPNAME')

    // this appears to report errors if app not found
    await this.heroku.get(`/apps/${app}`)
    await confirmApp(app, flags.confirm, `WARNING: This will delete ${color.app(app)} including all add-ons.`)
    ux.action.start(`Destroying ${color.app(app)} (including all add-ons)`)
    await this.heroku.delete(`/apps/${app}`)

    if (git.inGitRepo()) {
      // delete git remotes pointing to this app
      await git.listRemotes()
        .then(remotes => {
          const transformed = remotes
            .filter(r => git.gitUrl(app) === r[1] || git.sshGitUrl(app) === r[1])
            .map(r => r[0])

          const uniqueRemotes = uniq(transformed)

          uniqueRemotes.forEach(element => {
            git.rmRemote(element)
          })
        })
    }

    ux.action.stop()
  }
}

