import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

import {getPipeline} from '../../api'
import GitHubAPI from '../../github-api'
import KolkrabbiAPI from '../../kolkrabbi-api'
import getGitHubToken from '../../setup/get-github-token'
import getNameAndRepo from '../../setup/get-name-and-repo'
import getRepo from '../../setup/get-repo'
import {nameAndRepo} from '../../setup/validate'

export default class Promote extends Command {
  static description = 'promote the latest release of this app to its downstream app(s)'

  static examples = [`$ heroku pipelines:promote -a example-staging
  Promoting example-staging to example (production)... done, v23
  Promoting example-staging to example-admin (production)... done, v54
  
  $ heroku pipelines:promote -a example-staging --to my-production-app1,my-production-app2
  Starting promotion to apps: my-production-app1,my-production-app2... done
  Waiting for promotion to complete... done
  Promotion successful
  my-production-app1: succeeded
  my-production-app2: succeeded`]

  static flags = {
    repo: flags.string({
      name: 'to',
      char: 't',
      description: 'comma separated list of apps to promote to',
    })
  }

  async run() {
    const {flags} = this.parse(Promote)

    
  }
}
