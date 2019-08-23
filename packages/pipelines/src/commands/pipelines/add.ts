import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions'
import cli from 'cli-ux'
import {prompt} from 'inquirer'

import {createCoupling} from '../../api'
import disambiguate from '../../disambiguate'
import infer from '../../infer'
import {inferrableStageNames as stageNames} from '../../stages'

export default class PipelinesAdd extends Command {
  static description = `add this app to a pipeline
The app and pipeline names must be specified.
The stage of the app will be guessed based on its name if not specified.`

  static examples = [
    `$ heroku pipelines:add example -a example-admin -s production
Adding example-admin to example pipeline as production... done`
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({
      char: 's',
      description: 'stage of first app in pipeline',
      completion: StageCompletion
    })
  }

  static args = [{
    name: 'pipeline',
    description: 'name of pipeline',
    required: true
  }]

  async run() {
    const {args, flags} = this.parse(PipelinesAdd)
    const app = flags.app

    let stage
    let guesses = infer(app)
    let questions = []

    let pipeline: any = await disambiguate(this.heroku, args.pipeline)

    if (flags.stage) {
      stage = flags.stage
    } else {
      questions.push({
        type: 'list',
        name: 'stage',
        message: `Stage of ${app}`,
        choices: stageNames,
        default: guesses[1]
      })
    }

    let answers: any = await prompt(questions)
    if (answers.stage) stage = answers.stage

    cli.action.start(`Adding ${color.app(app)} to ${color.pipeline(pipeline.name)} pipeline as ${stage}`)
    await createCoupling(this.heroku, pipeline, app, stage)
    cli.action.stop()
  }
}
