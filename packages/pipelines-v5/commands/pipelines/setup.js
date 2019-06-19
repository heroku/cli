const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/api')
const KolkrabbiAPI = require('../../lib/kolkrabbi-api')
const GitHubAPI = require('../../lib/github-api')

const { flags } = require('@heroku-cli/command')

const Validate = require('./setup/validate')
const getGitHubToken = require('./setup/getGitHubToken')
const getNameAndRepo = require('./setup/getNameAndRepo')
const getRepo = require('./setup/getRepo')
const getSettings = require('./setup/getSettings')
const getCISettings = require('./setup/getCISettings')
const setupPipeline = require('./setup/setupPipeline')
const createApps = require('./setup/createApps')
const pollAppSetups = require('./setup/pollAppSetups')

module.exports = {
  topic: 'pipelines',
  command: 'setup',
  description: 'bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)',

  examples: `$ heroku pipelines:setup example githuborg/reponame -o example-org
? Automatically deploy the master branch to staging? Yes
? Wait for CI to pass before deploying the master branch to staging? Yes
? Enable review apps? Yes
? Automatically create review apps for every PR? Yes
? Automatically destroy idle review apps after 5 days? Yes
? Enable automatic Heroku CI test runs? Yes
Creating pipeline... done
Linking to repo... done
Creating production and staging apps (⬢ example and ⬢ example-staging)
Configuring pipeline... done
View your new pipeline by running \`heroku pipelines:open e5a55ffa-de3f-11e6-a245-3c15c2e6bc1e\``,
  needsApp: false,
  needsAuth: true,
  wantsOrg: true,
  args: [
    {
      name: 'name',
      description: 'name of pipeline',
      optional: true
    },
    {
      name: 'repo',
      description: 'a GitHub repository to connect the pipeline to',
      optional: true
    }
  ],
  flags: [
    flags.team({ name: 'team', hasValue: true, description: 'the team which will own the apps (can also use --org)' }),
    {
      name: 'yes',
      char: 'y',
      description: 'accept all default settings without prompting',
      hasValue: false
    }
  ],
  run: cli.command(co.wrap(function * (context, heroku) {
    const errors = Validate.nameAndRepo(context.args)

    if (errors.length) {
      cli.error(errors.join(', '))
      return
    }

    const kolkrabbi = new KolkrabbiAPI(context.version, heroku.options.token)
    const github = new GitHubAPI(context.version, yield getGitHubToken(kolkrabbi))

    const team = context.flags.team
    const { name: pipelineName, repo: repoName } = yield getNameAndRepo(context.args)
    const stagingAppName = pipelineName + Validate.STAGING_APP_INDICATOR
    const repo = yield getRepo(github, repoName)
    const settings = yield getSettings(context.flags.yes, repo.default_branch)

    let ciSettings = yield getCISettings(context.flags.yes, team)
    let ownerType = team ? 'team' : 'user'

    // If team or org is not specified, we assign ownership to the user creating
    let owner = team ? yield api.getTeam(heroku, team) : yield api.getAccountInfo(heroku)
    let ownerID = owner.id

    owner = { id: ownerID, type: ownerType }

    const pipeline = yield cli.action(
      'Creating pipeline',
      api.createPipeline(heroku, pipelineName, owner)
    )

    yield cli.action(
      'Linking to repo',
      kolkrabbi.createPipelineRepository(pipeline.id, repo.id)
    )

    const archiveURL = yield kolkrabbi.getArchiveURL(repoName, repo.default_branch)
    const appSetups = yield createApps(heroku, archiveURL, pipeline, pipelineName, stagingAppName, team)

    yield cli.action(
      `Creating production and staging apps (${cli.color.app(pipelineName)} and ${cli.color.app(stagingAppName)})`,
      pollAppSetups(heroku, appSetups)
    )

    const stagingApp = appSetups.find((appSetup) => appSetup.app.name === stagingAppName).app

    let setup = setupPipeline(kolkrabbi, stagingApp.id, settings, pipeline.id, ciSettings)

    yield cli.action('Configuring pipeline', setup).then(() => {
      cli.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`)
    })
  }))
}
