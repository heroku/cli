'use strict'

import {Command, flags} from '@heroku-cli/command'
import Git from '../../lib/git/git'

const git = new Git()

export default class Destroy extends Command {
  static description = 'permanently destroy an app'
  static help = 'This will also destroy all add-ons on the app.'
  static aliases = ['destroy', 'apps:delete']
  static flags = {
    app: flags.app({hidden: true}),
    confirm: flags.string({char: 'c'}),
  }

  async run() {
    const app = context.args.app || context.app
    if (!app) throw new Error('No app specified.\nUSAGE: heroku apps:destroy APPNAME')

    context.app = app // make sure context.app is always set for herkou-cli-util

    await heroku.get(`/apps/${app}`)
    await cli.confirmApp(app, context.flags.confirm, `WARNING: This will delete ${cli.color.app(app)} including all add-ons.`)
    const request = heroku.request({
      method: 'DELETE',
      path: `/apps/${app}`,
    })
    await cli.action(`Destroying ${cli.color.app(app)} (including all add-ons)`, request)

    if (git.inGitRepo()) {
      // delete git remotes pointing to this app
      await git.listRemotes()
        .filter(r => git.gitUrl(app) === r[1] || git.sshGitUrl(app) === r[1])
        .map(r => r[0])
        .uniq()
        .forEach(element => {
          git.rmRemote(element)
        })
    }
  }
}

