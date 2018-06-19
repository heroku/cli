import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'

import Git from '../../git'

export class GitRemote extends Command {
  static description = `adds a git remote to an app repo
extra arguments will be passed to git remote add
`
  static example = `# set git remote heroku to https://git.heroku.com/example.git
    $ heroku git:remote -a example

    # set git remote heroku-staging to https://git.heroku.com/example-staging.git
    $ heroku git:remote --remote heroku-staging -a example`
  static flags = {
    app: flags.string({char: 'a', description: 'the Heroku app to use'}),
    remote: flags.string({char: 'r', description: 'the git remote to create'}),
    'ssh-git': flags.boolean({description: 'use SSH git protocol'}),
  }
  static strict = false

  async run() {
    const {argv, flags} = this.parse(GitRemote)
    const git = new Git()
    let appName = flags.app || argv.shift() || process.env.HEROKU_APP
    if (!appName) {
      this.error('Specify an app with --app')
    }
    let {body: app} = await this.heroku.get(`/apps/${appName}`)
    let remote = flags.remote || (await git.remoteFromGitConfig()) || 'heroku'
    let remotes = await git.exec(['remote'])
    let url = git.url(app.name, flags['ssh-git'])
    if (remotes.split('\n').includes(remote)) {
      await git.exec(['remote', 'set-url', remote, url].concat(argv))
    } else {
      await git.exec(['remote', 'add', remote, url].concat(argv))
    }
    let newRemote = await git.remoteUrl(remote)
    this.log(`set git remote ${color.cyan(remote)} to ${color.cyan(newRemote)}`)
  }
}
