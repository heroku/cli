const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/api')
const KolkrabbiAPI = require('../../lib/kolkrabbi-api')
const GitHubAPI = require('../../lib/github-api')
const Validate = require('./setup/validate')
const getGitHubToken = require('./setup/getGitHubToken')
const getNameAndRepo = require('./setup/getNameAndRepo')
const getRepo = require('./setup/getRepo')

module.exports = {
  topic: 'pipelines',
  command: 'connect',
  description: 'connect a github repo to an existing pipeline',
  help: `Example:

    $ heroku pipelines:connect example -r githuborg/reponame
    Configuring pipeline... done`,
  needsApp: false,
  needsAuth: true,
  wantsOrg: false,
  args: [{
    name: 'name',
    description: 'name of pipeline',
    optional: true
  }
  ],
  flags: [
    {
      name: 'repo',
      char: 'r',
      description: 'the GitHub repository to connect',
      hasValue: true,
      required: true
    }
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    const args = { name: context.args.name, repo: context.flags.repo }
    const errors = Validate.nameAndRepo(args)

    if (errors.length) {
      cli.error(errors.join(', '))
      return
    }

    const kolkrabbi = new KolkrabbiAPI(context.version, heroku.options.token)
    const github = new GitHubAPI(context.version, yield getGitHubToken(kolkrabbi))
    const {
      name: pipelineName,
      repo: repoName
    } = yield getNameAndRepo(args)
    const repo = yield getRepo(github, repoName)

    const pipeline = yield api.getPipeline(heroku, pipelineName)

    yield cli.action(
      'Linking to repo',
      kolkrabbi.createPipelineRepository(pipeline.id, repo.id)
    )
  }))
}
