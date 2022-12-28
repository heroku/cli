import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {StageCompletion} from '@heroku-cli/command/lib/completions'
import {CliUx} from '@oclif/core'
import {prompt} from 'inquirer'

import {createCoupling} from '../../api'
import disambiguate from '../../disambiguate'
import infer from '../../infer'
import {inferrableStageNames as stageNames} from '../../stages'

const cli = CliUx.ux

export default class PipelinesAdd extends Command {
  static description = `add this app to a pipeline
The app and pipeline names must be specified.
The stage of the app will be guessed based on its name if not specified.`

  static examples = [
    '$ heroku pipelines:add my-pipeline -a my-app -s production',
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    stage: flags.string({
      char: 's',
      description: 'stage of first app in pipeline',
      completion: StageCompletion,
    }),
  }

  static args = [{
    name: 'pipeline',
    description: 'name of pipeline',
    required: true,
  }]

  async run() {
    const {args, flags} = await this.parse(PipelinesAdd)
    const app = flags.app

    let stage
    const guesses = infer(app)
    const questions = []

    const pipeline: any = await disambiguate(this.heroku, args.pipeline)

    if (flags.stage) {
      stage = flags.stage
    } else {
      questions.push({
        type: 'list',
        name: 'stage',
        message: `Stage of ${app}`,
        choices: stageNames,
        default: guesses[1],
      })
    }

    const answers: any = await prompt(questions)
    if (answers.stage) stage = answers.stage

    cli.action.start(`Adding ${color.app(app)} to ${color.pipeline(pipeline.name)} pipeline as ${stage}`)
    await createCoupling(this.heroku, pipeline, app, stage)
    cli.action.stop()
  }
}
