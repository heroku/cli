import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args} from '@oclif/core'

import Git from '../../lib/git/git.js'

export class GitClone extends Command {
  static args = {
    DIRECTORY: Args.string({description: 'where to clone the app', optional: true}),
  }

  static description = 'clones a heroku app to your local machine at DIRECTORY (defaults to app name)'

  static example = `${color.command('heroku git:clone -a example')}
Cloning into 'example'...
remote: Counting objects: 42, done.
...`

  static flags = {
    app: flags.string({char: 'a', description: 'the Heroku app to use', env: 'HEROKU_APP', required: true}),
    remote: flags.string({char: 'r', description: 'the git remote to create, default "heroku"'}),
  }

  async run() {
    const git = new Git()
    const {args, flags} = await this.parse(GitClone)
    const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${flags.app}`)
    const directory = args.DIRECTORY || (app.name as string)
    const remote = flags.remote || 'heroku'
    await git.spawn(['clone', '-o', remote, git.url(app.name!), directory])
  }
}
