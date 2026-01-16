import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import debug from 'debug'
import openBrowser from 'open'

import {createPipeline, getAccountInfo, getTeam} from '../../lib/api.js'
import GitHubAPI from '../../lib/pipelines/github-api.js'
import KolkrabbiAPI from '../../lib/pipelines/kolkrabbi-api.js'
import createApps from '../../lib/pipelines/setup/create-apps.js'
import getCISettings from '../../lib/pipelines/setup/get-ci-settings.js'
import getGitHubToken from '../../lib/pipelines/setup/get-github-token.js'
import getNameAndRepo from '../../lib/pipelines/setup/get-name-and-repo.js'
import getRepo from '../../lib/pipelines/setup/get-repo.js'
import getSettings from '../../lib/pipelines/setup/get-settings.js'
import pollAppSetups from '../../lib/pipelines/setup/poll-app-setups.js'
import setupPipeline from '../../lib/pipelines/setup/setup-pipeline.js'
import {STAGING_APP_INDICATOR, nameAndRepo} from '../../lib/pipelines/setup/validate.js'

const pipelineDebug = debug('pipelines:setup')

export default class Setup extends Command {
  static args = {
    name: Args.string({
      description: 'name of pipeline',
      required: false,
    }),
    repo: Args.string({
      description: 'a GitHub repository to connect the pipeline to',
      required: false,
    }),
  }

  static description
    = 'bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)'

  static examples = ['$ heroku pipelines:setup my-pipeline githuborg/reponame -t my-team']

  static flags = {
    team: flags.team({
      description: 'the team to assign pipeline ownership to (defaults to current user)',
    }),

    yes: flags.boolean({
      char: 'y',
      description: 'accept all default settings without prompting',
    }),
  }

  static open = openBrowser

  async run() {
    const {args, flags} = await this.parse(Setup)

    const errors = nameAndRepo(args)

    if (errors.length > 0) {
      this.error(errors.join(', '))
      return
    }

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, () => this.heroku.auth)
    const github = new GitHubAPI(this.config.userAgent, await getGitHubToken(kolkrabbi))

    const {team, yes} = flags

    const {name: pipelineName, repo: repoName} = await getNameAndRepo(args)
    const stagingAppName = pipelineName + STAGING_APP_INDICATOR
    const repo = await getRepo(github, repoName)
    const settings = await getSettings(yes, repo.default_branch)

    const ciSettings = await getCISettings(yes, team)
    const ownerType = team ? 'team' : 'user'

    // If team or org is not specified, we assign ownership to the user creating
    const {
      body: {id: ownerID},
    }: any = team ? await getTeam(this.heroku, team) : await getAccountInfo(this.heroku)
    const owner = {id: ownerID, type: ownerType}

    ux.action.start('Creating pipeline')
    const {body: pipeline}: any = await createPipeline(this.heroku, pipelineName, owner)
    ux.action.stop()

    ux.action.start('Linking to repo')
    await kolkrabbi.createPipelineRepository(pipeline.id, repo.id)
    ux.action.stop()

    const archiveURL = await kolkrabbi.getArchiveURL(repoName, repo.default_branch)

    const appSetupsResult: any = await createApps(this.heroku, archiveURL, pipeline, pipelineName, stagingAppName, team)
    const appSetups = appSetupsResult.map((result: any) => result.body)

    ux.action.start(
      `Creating production and staging apps (${color.app(pipelineName)} and ${color.app(stagingAppName)})`,
    )
    await pollAppSetups(this.heroku, appSetups)
    ux.action.stop()

    const stagingApp = appSetups.find((appSetup: any) => appSetup.app.name === stagingAppName).app

    const setup = setupPipeline(kolkrabbi, stagingApp.id, settings, pipeline.id, ciSettings)

    ux.action.start('Configuring pipeline')
    try {
      await setup
      await Setup.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`)
    } catch (error: any) {
      pipelineDebug(error)
      ux.error(error)
    } finally {
      ux.action.stop()
    }
  }
}
