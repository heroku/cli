import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions.js'
import {Args, ux} from '@oclif/core'
import inquirer, {type Answers, type InputQuestion, type ListQuestion} from 'inquirer'

import {
  Owner,
  createCoupling,
  createPipeline,
  getAccountInfo,
  getTeam,
} from '../../lib/api.js'
import {getGenerationByAppId} from '../../lib/apps/generation.js'
import infer from '../../lib/pipelines/infer.js'
import {inferrableStageNames as stages} from '../../lib/pipelines/stages.js'

export default class Create extends Command {
  static args = {
    name: Args.string({
      description: 'name of pipeline (defaults to basename of the app)',
      required: false,
    }),
  }

  static description = `create a new pipeline
  An existing app must be specified as the first app in the pipeline.
  The pipeline name will be inferred from the app name if not specified.
  The stage of the app will be guessed based on its name if not specified.
  The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.`

  static examples = [
    color.command('heroku pipelines:create -a my-app-staging'),
    color.command('heroku pipelines:create my-pipeline -a my-app-staging'),
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({
      char: 's',
      completion: StageCompletion,
      description: 'stage of first app in pipeline',
      name: 'stage',
    }),
    team: flags.team({
      description: 'the team which will own the apps',
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Create)
    const {app, stage: inputStage, team: teamName} = flags

    let name
    let stage
    let owner: Owner
    const guesses = infer(app)
    const questions: (InputQuestion | ListQuestion)[] = []

    if (args.name) {
      name = args.name
    } else {
      questions.push({
        default: guesses[0],
        message: 'Pipeline name',
        name: 'name',
        type: 'input',
      })
    }

    if (inputStage) {
      stage = inputStage
    } else {
      questions.push({
        choices: stages,
        default: guesses[1],
        message: `Stage of ${app}`,
        name: 'stage',
        type: 'list',
      })
    }

    const ownerType = teamName ? 'team' : 'user'

    // If team or org is not specified, we assign ownership to the user creating
    const response = teamName ? await getTeam(this.heroku, teamName) : await getAccountInfo(this.heroku)
    owner = response.body
    const ownerID = owner.id

    owner = {id: ownerID, type: ownerType}

    const answers: Answers = await inquirer.prompt(questions)
    if (answers.name) name = answers.name
    if (answers.stage) stage = answers.stage

    ux.action.start(`Creating ${name} pipeline`)
    const generation = await getGenerationByAppId(app, this.heroku)
    const {body: pipeline} = await createPipeline(this.heroku, name, owner, generation)
    ux.action.stop()

    ux.action.start(`Adding ${color.app(app)} to ${color.pipeline(pipeline.name || '')} pipeline as ${stage}`)
    await createCoupling(this.heroku, pipeline, app, stage)
    ux.action.stop()
  }
}
