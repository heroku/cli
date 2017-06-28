const cli = require('heroku-cli-util')
const co = require('co')
const api = require('../../lib/heroku-api')
const Utils = require('../../lib/utils')

function validateArgs (args) {
  if (args.length === 0) {
    cli.exit(1, 'Usage: heroku ci:config:set KEY1 [KEY2 ...]\nMust specify KEY to unset.')
  }
}

function* run (context, heroku) {
  validateArgs(context.args)

  const vars = context.args.reduce((memo, key) => {
    memo[key] = null
    return memo
  }, {})

  const pipeline = yield Utils.getPipeline(context, heroku)

  yield cli.action(
    `Unsetting ${Object.keys(vars).join(', ')}`,
    api.setConfigVars(heroku, pipeline.id, vars)
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
      description: 'pipeline'
    }
  ],
  help: `Examples:

    $ heroku ci:config:uset RAILS_ENV
    Unsetting RAILS_ENV... done
`,
  run: cli.command(co.wrap(run))
}
