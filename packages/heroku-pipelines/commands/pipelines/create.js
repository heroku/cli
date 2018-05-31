'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let api = require('../../lib/api')
let infer = require('../../lib/infer')
let prompt = require('../../lib/prompt')
let stages = require('../../lib/stages').inferrableStageNames

const {flags} = require('@heroku-cli/command')
const createCoupling = require('../../lib/api').createCoupling

function* run (context, heroku) {
  let name, stage, owner, ownerID, ownerType
  let guesses = infer(context.app)
  let questions = []

  const app = context.app

  if (context.args.name) {
    name = context.args.name
  } else {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Pipeline name',
      default: guesses[0]
    })
  }
  if (context.flags.stage) {
    stage = context.flags.stage
  } else {
    questions.push({
      type: 'list',
      name: 'stage',
      message: `Stage of ${app}`,
      choices: stages,
      default: guesses[1]
    })
  }

  const teamName = context.org || context.team || context.flags.team
  ownerType = teamName ? 'team' : 'user'

  // If team or org is not specified, we assign ownership to the user creating
  owner = teamName ? yield api.getTeam(heroku, teamName) : yield api.getAccountInfo(heroku)
  ownerID = owner.id

  owner = { id: ownerID, type: ownerType }

  let answers = yield prompt(questions)
  if (answers.name) name = answers.name
  if (answers.stage) stage = answers.stage
  let promise = api.createPipeline(heroku, name, owner)
  let pipeline = yield cli.action(`Creating ${name} pipeline`, promise)

  yield cli.action(`Adding ${cli.color.app(app)} to ${cli.color.pipeline(pipeline.name)} pipeline as ${stage}`,
    createCoupling(heroku, pipeline, app, stage))
}

module.exports = {
  topic: 'pipelines',
  command: 'create',
  description: 'create a new pipeline',
  help: `An existing app must be specified as the first app in the pipeline.
The pipeline name will be inferred from the app name if not specified.
The stage of the app will be guessed based on its name if not specified.
The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.`,
  examples: `$ heroku pipelines:create -a example-staging
? Pipeline name: example
? Stage of example-staging: staging
Creating example pipeline... done
Adding example-staging to example pipeline as staging... done`,
  needsApp: true,
  needsAuth: true,
  wantsOrg: true,
  args: [
    {name: 'name', description: 'name of pipeline, defaults to basename of app', optional: true}
  ],
  flags: [
    {name: 'stage', char: 's', description: 'stage of first app in pipeline', hasValue: true},
    flags.team({name: 'team', hasValue: true, description: 'the team which will own the apps (can also use --org)'})
  ],
  run: cli.command(co.wrap(run))
}
