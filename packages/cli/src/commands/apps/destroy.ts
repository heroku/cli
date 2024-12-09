import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import confirmCommand from '../../lib/confirmCommand'
import * as git from '../../lib/ci/git'

export default class Destroy extends Command {
  static description = 'permanently destroy an app'
  static help = 'This will also destroy all add-ons on the app.'
  static hiddenAliases = ['destroy', 'apps:delete']
  static flags = {
    app: flags.app(),
    remote: flags.remote(),
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
    await confirmCommand(app, flags.confirm, `WARNING: This will delete ${color.app(app)} including all add-ons.`)
    ux.action.start(`Destroying ${color.app(app)} (including all add-ons)`)
    await this.heroku.delete(`/apps/${app}`)

    /**
     * It is possible to have as many git remotes as
     * you want, and they can all point to the same url.
     * The only requirement is that the "name" is unique.
     */
    if (git.inGitRepo()) {
      // delete git remotes pointing to this app
      const remotes = await git.listRemotes()
      await Promise.all([
        remotes.get(git.gitUrl(app))?.map(({name}) => git.rmRemote(name)),
        remotes.get(git.sshGitUrl(app))?.map(({name}) => git.rmRemote(name)),
      ])
    }

    ux.action.stop()
  }
}

