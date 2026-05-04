import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

export class GitCredentials extends Command {
  static args = {
    command: Args.string({description: 'command name of the git credentials', required: true}),
  }
  static description = 'internal command for git-credentials'
  static hidden = true

  async run() {
    const {args} = await this.parse(GitCredentials)
    switch (args.command) {
      case 'erase':
      // eslint-ignore-next-line no-fallthrough
      case 'store': {
      // ignore
        break
      }

      case 'get': {
        if (!this.heroku.auth) throw new Error('not logged in')
        ux.stdout(`protocol=https
host=git.heroku.com
username=heroku
password=${this.heroku.auth}`)
        break
      }

      default: {
        throw new Error(`unknown command: ${args.command}`)
      }
    }
  }
}
