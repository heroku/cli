import {Command} from '@heroku-cli/command'

export class GitCredentials extends Command {
  static hidden = true

  static description = 'internal command for git-credentials'

  static args = [
    {name: 'command', required: true},
  ]

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
