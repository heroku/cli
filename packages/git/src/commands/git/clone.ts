import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'

import Git from '../../git'

export class GitClone extends Command {
  static description = 'clones a heroku app to your local machine at DIRECTORY (defaults to app name)'

  static example = `$ heroku git:clone -a example
Cloning into 'example'...
remote: Counting objects: 42, done.
...`

  static args = [
    {name: 'DIRECTORY', optional: true, description: 'where to clone the app'},
  ]

  static flags = {
    app: flags.string({char: 'a', env: 'HEROKU_APP', required: true, description: 'the Heroku app to use'}),
    remote: flags.string({char: 'r', description: 'the git remote to create, default "heroku"'}),
  }

  async run() {
    const git = new Git()
    const {flags, args} = await this.parse(GitClone)
    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const directory = args.DIRECTORY || app.name
    const remote = flags.remote || 'heroku'
    await git.spawn(['clone', '-o', remote, git.url(app.name!), directory])
  }
}
