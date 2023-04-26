const cli = require('heroku-cli-util')
const api = require('../../lib/heroku-api')
const Utils = require('../../lib/utils')
const PipelineCompletion = require('../../lib/completions')

function validateArgs(args) {
  if (args.length === 0) {
    cli.exit(1, 'Usage: heroku ci:config:set KEY1 [KEY2 ...]\nMust specify KEY to unset.')
  }
}

async function run(context, heroku) {
  validateArgs(context.args)

  const vars = context.args.reduce((memo, key) => {
    memo[key] = null
    return memo
  }, {})

  const pipeline = await Utils.getPipeline(context, heroku)

  await cli.action(
    `Unsetting ${Object.keys(vars).join(', ')}`,
    api.setConfigVars(heroku, pipeline.id, vars),
  )
}

module.exports = {
  topic: 'ci',
  command: 'config:unset',
  wantsApp: true,
  needsAuth: true,
  variableArgs: true,
  description: 'unset CI config vars',
  flags: [
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline',
      completion: PipelineCompletion,
    },
  ],
  help: `Examples:

    $ heroku ci:config:uset RAILS_ENV
    Unsetting RAILS_ENV... done
`,
  run: cli.command(run),
}
