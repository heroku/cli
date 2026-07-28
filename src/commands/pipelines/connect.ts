import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

import {getPipeline} from '../../lib/api.js'
import getNameAndRepo from '../../lib/pipelines/setup/get-name-and-repo.js'
import getRepo from '../../lib/pipelines/setup/get-repo.js'
import {nameAndRepo} from '../../lib/pipelines/setup/validate.js'

export default class Connect extends Command {
  static args = {
    name: Args.string({
      description: 'name of pipeline',
      required: true,
    }),
  }
  static description = 'connect a GitHub repo to an existing pipeline'
  static examples = [
    color.command('heroku pipelines:connect my-pipeline -r githuborg/reponame'),
  ]
  static flags = {
    repo: flags.string({
      char: 'r',
      description: 'the GitHub repository to connect to',
      name: 'repo',
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

    const {
      name: pipelineName,
      repo: repoName,
    } = await getNameAndRepo(combinedInputs)

    const repo = await getRepo(this.heroku, repoName)

    const pipeline = await getPipeline(this.heroku, pipelineName)

    ux.action.start('Linking to repo')
    await this.heroku.post(`/pipelines/${pipeline.body.id}/repo`, {
      body: {repo_url: `https://github.com/${repo.full_name}`},
      headers: {Accept: 'application/vnd.heroku+json; version=3.repositories-api'},
    })
    ux.action.stop()
  }
}
