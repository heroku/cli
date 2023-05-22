import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import Git from '../../git'

export class GitRemote extends Command {
  static description = `adds a git remote to an app repo
extra arguments will be passed to git remote add
`

  static example = `# set git remote heroku to https://git.heroku.com/example.git
    $ heroku git:remote -a example

    # set git remote heroku-staging to https://git.heroku.com/example.git
    $ heroku git:remote --remote heroku-staging -a example`

  static flags = {
    app: flags.string({char: 'a', description: 'the Heroku app to use'}),
    remote: flags.string({char: 'r', description: 'the git remote to create'}),
  }

  static strict = false

  async run() {
    const {argv, flags} = await this.parse(GitRemote)
    const git = new Git()
    const appName = flags.app || argv.shift() || process.env.HEROKU_APP
    if (!appName) {
      this.error('Specify an app with --app')
    }

    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    const remote = flags.remote || (await git.remoteFromGitConfig()) || 'heroku'
    const remotes = await git.exec(['remote'])
    const url = git.url(app.name!)
    if (remotes.split('\n').includes(remote)) {
      await git.exec(['remote', 'set-url', remote, url].concat(argv))
    } else {
      await git.exec(['remote', 'add', remote, url].concat(argv))
    }

    const newRemote = await git.remoteUrl(remote)
    this.log(`set git remote ${color.cyan(remote)} to ${color.cyan(newRemote)}`)
  }
}
