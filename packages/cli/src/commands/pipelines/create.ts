import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions.js'
import {Args, ux} from '@oclif/core'
import inquirer, {type Answers, type InputQuestion, type ListQuestion} from 'inquirer'

import {createCoupling, createPipeline, getAccountInfo, getTeam, Owner} from '../../lib/api.js'
import infer from '../../lib/pipelines/infer.js'
import {inferrableStageNames as stages} from '../../lib/pipelines/stages.js'
import {getGenerationByAppId} from '../../lib/apps/generation.js'

export default class Create extends Command {
  static description = `create a new pipeline
  An existing app must be specified as the first app in the pipeline.
  The pipeline name will be inferred from the app name if not specified.
  The stage of the app will be guessed based on its name if not specified.
  The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.`

  static examples = [
    '$ heroku pipelines:create -a my-app-staging',
    '$ heroku pipelines:create my-pipeline -a my-app-staging',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({
      name: 'stage',
      char: 's',
      description: 'stage of first app in pipeline',
      completion: StageCompletion,
    }),
    team: flags.team({
      description: 'the team which will own the apps',
    }),
  }

  static args = {
    name: Args.string({
      description: 'name of pipeline (defaults to basename of the app)',
      required: false,
    }),
  }

  async run() {
    const {args, flags} = await this.parse(Create)

    let name
    let stage
    let owner: Owner
    const guesses = infer(flags.app)
    const questions: (InputQuestion | ListQuestion)[] = []

    const app = flags.app

    if (args.name) {
      name = args.name
    } else {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Pipeline name',
        default: guesses[0],
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
        default: guesses[1],
      })
    }

    const teamName = flags.team
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

    ux.action.start(`Adding ${color.app(app)} to ${color.pipeline(pipeline.name)} pipeline as ${stage}`)
    await createCoupling(this.heroku, pipeline, app, stage)
    ux.action.stop()
  }
}
