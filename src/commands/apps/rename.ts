import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import * as git from '../../lib/ci/git.js'

export default class AppsRename extends Command {
  static args = {
    newname: Args.string({description: 'new unique name of the app', required: true}),
  }

  static description = 'rename an app'
  static examples = [
    color.command('heroku apps:rename --app oldname newname'),
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static help = 'This will locally update the git remote if it is set to the old app.'

  static hiddenAliases = ['rename']

  static topic = 'apps'

  async run() {
    const {args, flags} = await this.parse(AppsRename)
    const oldApp = flags.app
    const newApp = args.newname

    ux.action.start(`Renaming ${color.app(oldApp)} to ${color.info(newApp)}`)
    const appResponse = await this.heroku.patch<Heroku.App>(`/apps/${oldApp}`, {body: {name: newApp}})
    const app = appResponse.body
    ux.action.stop()

    const gitUrl = git.gitUrl(app.name)
    ux.stdout(`${color.info(app.web_url!)} | ${color.info(gitUrl)}`)

    if (!app.web_url!.includes('https')) {
      ux.stdout('Please note that it may take a few minutes for Heroku to provision a SSL certificate for your application.')
    }

    if (git.inGitRepo()) {
      /**
       * It is possible to have as many git remotes as
       * you want, and they can all point to the same url.
       * The only requirement is that the "name" is unique.
       */
      const remotes = await git.listRemotes()
      const httpsUrl = git.gitUrl(oldApp)
      const sshUrl = git.sshGitUrl(oldApp)
      const targetRemotesBySSHUrl = remotes.get(sshUrl)
      const targetRemotesByHttpsUrl = remotes.get(httpsUrl)

      const doRename = async (remotes: {name: string}[] | undefined, url: string) => {
        for (const remote of remotes ?? []) {
          const {name} = remote
          await git.rmRemote(name)
          await git.createRemote(name, url.replace(oldApp, newApp))
          ux.stdout(`Git remote ${color.name(name)} updated`)
        }
      }

      await Promise.all([
        doRename(targetRemotesByHttpsUrl, httpsUrl),
        doRename(targetRemotesBySSHUrl, sshUrl),
      ])
    }

    ux.warn("Don't forget to update git remotes for all other local checkouts of the app.")
  }
}
