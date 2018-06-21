'use strict'

let co = require('co')
let cli = require('heroku-cli-util')
let infer = require('../../lib/infer')
let disambiguate = require('../../lib/disambiguate')
let prompt = require('../../lib/prompt')
let stageNames = require('../../lib/stages').inferrableStageNames
const {StageCompletion} = require('@heroku-cli/command/lib/completions')

const createCoupling = require('../../lib/api').createCoupling

module.exports = {
  topic: 'pipelines',
  command: 'add',
  description: 'add this app to a pipeline',
  help: `The app and pipeline names must be specified.
The stage of the app will be guessed based on its name if not specified.`,
  examples: `$ heroku pipelines:add example -a example-admin -s production
Adding example-admin to example pipeline as production... done`,
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'pipeline', description: 'name of pipeline', optional: false}
  ],
  flags: [
    {name: 'stage', char: 's', description: 'stage of first app in pipeline', hasValue: true, completion: StageCompletion}
  ],
  run: cli.command(co.wrap(function * (context, heroku) {
    const app = context.app

    var stage
    let guesses = infer(context.app)
    let questions = []

    let pipeline = yield disambiguate(heroku, context.args.pipeline)

    if (context.flags.stage) {
      stage = context.flags.stage
    } else {
      questions.push({
        type: 'list',
        name: 'stage',
        message: `Stage of ${app}`,
        choices: stageNames,
        default: guesses[1]
      })
    }
    let answers = yield prompt(questions)
    if (answers.stage) stage = answers.stage

    yield cli.action(`Adding ${cli.color.app(app)} to ${cli.color.pipeline(pipeline.name)} pipeline as ${stage}`,
      createCoupling(heroku, pipeline, app, stage))
  }))
}
