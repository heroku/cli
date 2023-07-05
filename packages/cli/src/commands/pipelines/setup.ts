
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import Debug from 'debug'

import {createPipeline, getAccountInfo, getTeam} from '../../lib/pipelines/api'
import GitHubAPI from '../../lib/pipelines/github-api'
import KolkrabbiAPI from '../../lib/pipelines/kolkrabbi-api'
import createApps from '../../lib/pipelines/setup/create-apps'
import getCISettings from '../../lib/pipelines/setup/get-ci-settings'
import getGitHubToken from '../../lib/pipelines/setup/get-github-token'
import getNameAndRepo from '../../lib/pipelines/setup/get-name-and-repo'
import getRepo from '../../lib/pipelines/setup/get-repo'
import getSettings from '../../lib/pipelines/setup/get-settings'
import pollAppSetups from '../../lib/pipelines/setup/poll-app-setups'
import setupPipeline from '../../lib/pipelines/setup/setup-pipeline'
import {nameAndRepo, STAGING_APP_INDICATOR} from '../../lib/pipelines/setup/validate'

// eslint-disable-next-line new-cap
const debug = Debug('pipelines:setup')

export default class Setup extends Command {
  static description =
    'bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)'

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

  static args = [
    {
      name: 'name',
      description: 'name of pipeline',
      required: false,
    },
    {
      name: 'repo',
      description: 'a GitHub repository to connect the pipeline to',
      required: false,
    },
  ]

  async run() {
    const {args, flags} = await this.parse(Setup)

    const errors = nameAndRepo(args)

    if (errors.length > 0) {
      this.error(errors.join(', '))
      return
    }

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, () => this.heroku.auth)
    const github = new GitHubAPI(this.config.userAgent, await getGitHubToken(kolkrabbi))

    const team = flags.team

    const {name: pipelineName, repo: repoName} = await getNameAndRepo(args)
    const stagingAppName = pipelineName + STAGING_APP_INDICATOR
    const repo = await getRepo(github, repoName)
    const settings = await getSettings(flags.yes, repo.default_branch)

    const ciSettings = await getCISettings(flags.yes, team)
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
      await ux.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`)
    } catch (error: any) {
      debug(error)
      ux.error(error)
    } finally {
      ux.action.stop()
    }
  }
}
