import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'
import {prompt} from 'inquirer'

import * as api from '../../api'
import infer from '../../infer'
import {inferrableStageNames as stages} from '../../stages'

export default class Create extends Command {
  static description = `'create a new pipeline
  An existing app must be specified as the first app in the pipeline.
  The pipeline name will be inferred from the app name if not specified.
  The stage of the app will be guessed based on its name if not specified.
  The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.`

  static examples = [
    `$ heroku pipelines:create -a example-staging
? Pipeline name: example
? Stage of example-staging: staging
Creating example pipeline... done
Adding example-staging to example pipeline as staging... done`
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({
      name: 'stage',
      char: 's',
      description: 'stage of first app in pipeline',
      completion: StageCompletion
    }),
    team: flags.team({
      description: 'the team which will own the apps (can also use --org)'
    })
  }

  static args = [{
    name: 'name',
    description: 'name of pipeline, defaults to basename of app',
    required: false
  }]

  async run() {
    const {args, flags} = this.parse(Create)

    let name
    let stage
    let owner: any
    let ownerID
    let ownerType
    let guesses = infer(flags.app)
    let questions: any = []

    const app = flags.app

    if (args.name) {
      name = args.name
    } else {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Pipeline name',
        default: guesses[0]
      })
    }
    if (flags.stage) {
      stage = flags.stage
    } else {
      questions.push({
        type: 'list',
        name: 'stage',
        message: `Stage of ${app}`,
        choices: stages,
        default: guesses[1]
      })
    }

    const teamName = flags.team
    ownerType = teamName ? 'team' : 'user'

    // If team or org is not specified, we assign ownership to the user creating
    owner = teamName ? await api.getTeam(this.heroku, teamName) : await api.getAccountInfo(this.heroku)
    ownerID = owner.id

    owner = {id: ownerID, type: ownerType}

    let answers: any = await prompt(questions)
    if (answers.name) name = answers.name
    if (answers.stage) stage = answers.stage

    cli.action.start(`Creating ${name} pipeline`)
    let {body: pipeline}: any = await api.createPipeline(this.heroku, name, owner)
    cli.action.stop()

    cli.action.start(`Adding ${color.app(app)} to ${color.pipeline(pipeline.name)} pipeline as ${stage}`)
    await api.createCoupling(this.heroku, pipeline, app, stage)
    cli.action.stop()
  }
}
