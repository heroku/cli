import {Command, flags} from '@heroku-cli/command'
import KolkrabbiAPI from '../../kolkrabbi-api'
import GitHubAPI from '../../github-api'
import getGitHubToken from '../../setup/get-github-token'

export interface Options {
  name: string
  defaults?: boolean
  force?: boolean
}

export default abstract class Connect extends Command {
  static description = 'add a command to an existing CLI or plugin'

  static flags = {
    repo: flags.string({
      name: 'repo',
      char: 'r',
      description: 'the GitHub repository to connect',
      required: true
    })
  }
  static args = [{
    name: 'name',
    description: 'name of pipeline',
    optional: true
  }]

  async run() {
    const {flags, args} = this.parse(Connect)

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, this.heroku.auth)
    const github = new GitHubAPI(this.config.userAgent, await getGitHubToken(kolkrabbi))
  }
}
