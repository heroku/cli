import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import cli from 'cli-ux'

import * as api from '../../api'
import GitHubAPI from '../../github-api'
import KolkrabbiAPI from '../../kolkrabbi-api'
import createApps from '../../setup/create-apps'
import getCISettings from '../../setup/get-ci-settings'
import getGitHubToken from '../../setup/get-github-token'
import getNameAndRepo from '../../setup/get-name-and-repo'
import getRepo from '../../setup/get-repo'
import getSettings from '../../setup/get-settings'
import pollAppSetups from '../../setup/poll-app-setups'
import setupPipeline from '../../setup/setup-pipeline'
import * as Validate from '../../setup/validate'

export default class Setup extends Command {
  static description = 'bootstrap a new pipeline with common settings and create a production and staging app (requires a fully formed app.json in the repo)'

  static examples = [`$ heroku pipelines:setup example githuborg/reponame -o example-org
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
View your new pipeline by running \`heroku pipelines:open e5a55ffa-de3f-11e6-a245-3c15c2e6bc1e\``]

  static flags = {
    team: flags.team({
      description: 'the team which will own the apps (can also use --org)'
    }),

    yes: flags.boolean({
      char: 'y',
      description: 'accept all default settings without prompting'
    })
  }

  static args = [
    {
      name: 'name',
      description: 'name of pipeline',
      required: false
    },
    {
      name: 'repo',
      description: 'a GitHub repository to connect the pipeline to',
      required: false
    }
  ]

  async run() {
    const {args, flags} = this.parse(Setup)

    const errors = Validate.nameAndRepo(args)

    if (errors.length) {
      this.error(errors.join(', '))
      return
    }

    const kolkrabbi = new KolkrabbiAPI(this.config.userAgent, this.heroku.auth)
    const github = new GitHubAPI(this.config.userAgent, await getGitHubToken(kolkrabbi))

    const team = flags.team

    const {name: pipelineName, repo: repoName} = await getNameAndRepo(args)
    const stagingAppName = pipelineName + Validate.STAGING_APP_INDICATOR
    const repo = await getRepo(github, repoName)
    const settings = await getSettings(flags.yes, repo.default_branch)

    const ciSettings = await getCISettings(flags.yes, team)
    const ownerType = team ? 'team' : 'user'

    // If team or org is not specified, we assign ownership to the user creating
    const {body: {id: ownerID}}: any = team ? await api.getTeam(this.heroku, team) : await api.getAccountInfo(this.heroku)
    const owner = {id: ownerID, type: ownerType}

    cli.action.start('Creating pipeline')
    const {body: pipeline}: any = await api.createPipeline(this.heroku, pipelineName, owner)
    cli.action.stop()

    cli.action.start('Linking to repo')
    await kolkrabbi.createPipelineRepository(pipeline.id, repo.id)
    cli.action.stop()

    const archiveURL = await kolkrabbi.getArchiveURL(repoName, repo.default_branch)

    const appSetupsResult: any = (await createApps(this.heroku, archiveURL, pipeline, pipelineName, stagingAppName, team))
    const appSetups = appSetupsResult.map((result: any) => result.body)

    cli.action.start(`Creating production and staging apps (${color.app(pipelineName)} and ${color.app(stagingAppName)})`)
    await pollAppSetups(this.heroku, appSetups)
    cli.action.stop()

    const stagingApp = appSetups.find((appSetup: any) => appSetup.app.name === stagingAppName).app

    const setup = setupPipeline(kolkrabbi, stagingApp.id, settings, pipeline.id, ciSettings)

    cli.action.start('Configuring pipeline')
    await setup.then(() => cli.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`))
    cli.action.stop()
  }
}
