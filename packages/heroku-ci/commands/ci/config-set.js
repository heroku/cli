const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')

function validateArgs (args) {
  if (args.length === 0) {
    cli.exit(1, 'Usage: heroku ci:config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
  }
}

function validateInput (str) {
  if (!str.includes('=')) {
    cli.exit(1, `${cli.color.cyan(str)} is invalid. Must be in the format ${cli.color.cyan('FOO=bar')}.`)
  }

  return true
}

function* run (context, heroku) {
  validateArgs(context.args)

  const vars = context.args.reduce((memo, str) => {
    validateInput(str)
    const [key, value] = str.split('=')
    memo[key] = value
    return memo
  }, {})

  const coupling = yield api.pipelineCoupling(heroku, context.app)

  yield cli.action(
    `Setting ${Object.keys(vars).join(', ')}`,
    api.setConfigVars(heroku, coupling.pipeline.id, vars)
  )

  cli.styledObject(Object.keys(vars).reduce((memo, key) => {
    memo[cli.color.green(key)] = vars[key]
    return memo
  }, {}))
}

module.exports = {
  topic: 'ci',
  command: 'config:set',
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  description: 'set CI config vars',
  help: `Examples:
$ heroku ci:config:set RAILS_ENV=test
Setting test config vars... done

RAILS_ENV: test
`,
  run: cli.command(co.wrap(run))
}
