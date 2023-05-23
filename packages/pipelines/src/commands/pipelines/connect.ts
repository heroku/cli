import {Command, flags} from '@heroku-cli/command'
import {CliUx} from '@oclif/core'

import {getPipeline} from '../../api'
import GitHubAPI from '../../github-api'
import KolkrabbiAPI from '../../kolkrabbi-api'
import getGitHubToken from '../../setup/get-github-token'
import getNameAndRepo from '../../setup/get-name-and-repo'
import getRepo from '../../setup/get-repo'
import {nameAndRepo} from '../../setup/validate'

const cli = CliUx.ux

export default class Connect extends Command {
  static description = 'connect a github repo to an existing pipeline'

  static examples = [
    '$ heroku pipelines:connect my-pipeline -r githuborg/reponame',
  ]

  static flags = {
    repo: flags.string({
      name: 'repo',
      char: 'r',
      description: 'the GitHub repository to connect to',
      required: true,
    }),
  }

  static args = [{
    name: 'name',
    description: 'name of pipeline',
    required: true,
  }]

  async run() {
    const {args, flags} = await this.parse(Connect)

    const combinedInputs = {
      name: args.name,
      repo: flags.repo,
    }

    const errors = nameAndRepo({repo: flags.repo})

    if (errors.length > 0) {
      this.error(errors.join(', '))
      return
    }

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, () => this.heroku.auth)
    const github = new GitHubAPI(this.config.userAgent, await getGitHubToken(kolkrabbi))

    const {
      name: pipelineName,
      repo: repoName,
    } = await getNameAndRepo(combinedInputs)

    const repo = await getRepo(github, repoName)

    const pipeline = await getPipeline(this.heroku, pipelineName)

    cli.action.start('Linking to repo')
    await kolkrabbi.createPipelineRepository(pipeline.body.id, repo.id)
    cli.action.stop()
  }
}
