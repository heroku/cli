import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {getPipeline} from '../../lib/api'
import GitHubAPI from '../../lib/pipelines/github-api'
import KolkrabbiAPI from '../../lib/pipelines/kolkrabbi-api'
import getGitHubToken from '../../lib/pipelines/setup/get-github-token'
import getNameAndRepo from '../../lib/pipelines/setup/get-name-and-repo'
import getRepo from '../../lib/pipelines/setup/get-repo'
import {nameAndRepo} from '../../lib/pipelines/setup/validate'

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

  static args = {
    name: Args.string({
      description: 'name of pipeline',
      required: true,
    }),
  }

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

    ux.action.start('Linking to repo')
    await kolkrabbi.createPipelineRepository(pipeline.body.id, repo.id)
    ux.action.stop()
  }
}
