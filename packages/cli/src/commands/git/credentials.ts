import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'

export class GitCredentials extends Command {
  static hidden = true

  static description = 'internal command for git-credentials'

  static args = {
    command: Args.string({required: true, description: 'command name of the git credentials'}),
  }

  async run() {
    const {args} = await this.parse(GitCredentials)
    switch (args.command) {
    case 'get':
      if (!this.heroku.auth) throw new Error('not logged in')
      this.log(`protocol=https
host=git.heroku.com
username=heroku
password=${this.heroku.auth}`)
      break
    case 'erase':
    case 'store':
      // ignore
      break
    default:
      throw new Error(`unknown command: ${args.command}`)
    }
  }
}
