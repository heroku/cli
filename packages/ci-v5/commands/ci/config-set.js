const cli = require('heroku-cli-util')
const api = require('../../lib/heroku-api')
const Utils = require('../../lib/utils')
const PipelineCompletion = require('../../lib/completions')

function validateArgs(args) {
  if (args.length === 0) {
    cli.exit(1, 'Usage: heroku ci:config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
  }
}

function validateInput(str) {
  if (!str.includes('=')) {
    cli.exit(1, `${cli.color.cyan(str)} is invalid. Must be in the format ${cli.color.cyan('FOO=bar')}.`)
  }

  return true
}

async function run(context, heroku) {
  validateArgs(context.args)

  const vars = context.args.reduce((memo, str) => {
    validateInput(str)
    const [key, value] = str.split('=')
    memo[key] = value
    return memo
  }, {})

  const pipeline = await Utils.getPipeline(context, heroku)

  await cli.action(
    `Setting ${Object.keys(vars).join(', ')}`,
    api.setConfigVars(heroku, pipeline.id, vars),
  )

  cli.styledObject(Object.keys(vars).reduce((memo, key) => {
    memo[cli.color.green(key)] = vars[key]
    return memo
  }, {}))
}

module.exports = {
  topic: 'ci',
  command: 'config:set',
  wantsApp: true,
  needsAuth: true,
  variableArgs: true,
  description: 'set CI config vars',
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

    $ heroku ci:config:set RAILS_ENV=test
    Setting test config vars... done

    RAILS_ENV: test
`,
  run: cli.command(run),
}
