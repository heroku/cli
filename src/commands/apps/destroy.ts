import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import * as git from '../../lib/ci/git.js'
import ConfirmCommand from '../../lib/confirm-command.js'

export default class Destroy extends Command {
  static args = {
    app: Args.string({hidden: true}),
  }
  static description = 'permanently destroy an app'
  static flags = {
    app: flags.app(),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }
  static help = 'This will also destroy all add-ons on the app.'
  static hiddenAliases = ['destroy', 'apps:delete']

  async run() {
    const {args, flags} = await this.parse(Destroy)

    const app = args.app || flags.app
    if (!app) throw new Error('No app specified.\nUSAGE: heroku apps:destroy APPNAME')

    // this appears to report errors if app not found
    await this.heroku.get(`/apps/${app}`)
    await new ConfirmCommand().confirm(app, flags.confirm, `This will delete ${color.app(app)} including all add-ons.`)
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
      // Deduplicate remote names (same name appears for fetch and push)
      const names = new Set([
        ...(remotes.get(git.gitUrl(app))?.map(({name}) => name) ?? []),
        ...(remotes.get(git.sshGitUrl(app))?.map(({name}) => name) ?? []),
      ])
      await Promise.all([...names].map(name => git.rmRemote(name)))
    }

    ux.action.stop()
  }
}
