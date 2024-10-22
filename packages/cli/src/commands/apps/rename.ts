import {Args, ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as _ from 'lodash'
import * as git from '../../lib/ci/git'
import color from '@heroku-cli/color'

export default class AppsRename extends Command {
  static description = 'rename an app'
  static help = 'This will locally update the git remote if it is set to the old app.'
  static topic = 'apps'
  static hiddenAliases = ['rename']

  static examples = [
    '$ heroku apps:rename --app oldname newname',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    newname: Args.string({required: true, description: 'new unique name of the app'}),
  }

  async run() {
    const {flags, args} = await this.parse(AppsRename)
    const oldApp = flags.app
    const newApp = args.newname

    ux.action.start(`Renaming ${color.cyan(oldApp)} to ${color.green(newApp)}`)
    const appResponse = await this.heroku.patch<Heroku.App>(`/apps/${oldApp}`, {body: {name: newApp}})
    const app = appResponse.body
    ux.action.stop()

    const gitUrl = git.gitUrl(app.name)
    ux.log(`${app.web_url} | ${gitUrl}`)

    if (!app.web_url!.includes('https')) {
      ux.log('Please note that it may take a few minutes for Heroku to provision a SSL certificate for your application.')
    }

    if (git.inGitRepo()) {
    // delete git remotes pointing to this app
      await _(await git.listRemotes())
        .filter(r => git.gitUrl(oldApp) === r[1] || git.sshGitUrl(oldApp) === r[1])
        .map(r => r[0])
        .uniq()
        .map(r => {
          return git.rmRemote(r)
            .then(() => git.createRemote(r, gitUrl))
            .then(() => ux.log(`Git remote ${r} updated`))
        }).value()
    }

    ux.warn("Don't forget to update git remotes for all other local checkouts of the app.")
  }
}
