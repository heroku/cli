import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

import api from '../../api'
import GitHubAPI from '../../github-api'
import KolkrabbiAPI from '../../kolkrabbi-api'
import getGitHubToken from '../../setup/get-github-token'
import getNameAndRepo from '../../setup/get-name-and-repo'
import getRepo from '../../setup/get-repo'
import Validate from '../../setup/validate'
import debugFactory from 'debug'

const debug = debugFactory('heroku pipelines:connect')

export default class Connect extends Command {
  static description = 'connect a github repo to an existing pipeline'

  static examples = [`$ heroku pipelines:connect example -r githuborg/reponame
  Configuring pipeline... done`]

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
    debug('after after parsing')
    const {flags, args} = this.parse(Connect)
    const errors = Validate.nameAndRepo(args)

    
    if (errors.length) {
      this.error(errors.join(', '))
      return
    }

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, this.heroku.auth)
    const github = new GitHubAPI(this.config.userAgent, await getGitHubToken(kolkrabbi))

    const {
        name: pipelineName,
        repo: repoName
      } = await getNameAndRepo(args)
    const repo = await getRepo(github, repoName)

    const pipeline = await api.getPipeline(this.heroku, pipelineName)

    cli.action.start('Linking to repo')
    await kolkrabbi.createPipelineRepository(pipeline.body.id, repo.id)
    cli.action.stop()
  }
}
