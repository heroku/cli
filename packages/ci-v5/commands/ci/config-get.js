const cli = require('heroku-cli-util')
const shellescape = require('shell-escape')
const api = require('../../lib/heroku-api')
const Utils = require('../../lib/utils')
const PipelineCompletion = require('../../lib/completions')

async function run(context, heroku) {
  const pipeline = await Utils.getPipeline(context, heroku)
  const config = await api.configVars(heroku, pipeline.id)
  const value = config[context.args.key]

  if (context.flags.shell) {
    cli.log(`${context.args.key}=${shellescape([value])}`)
  } else {
    cli.log(value)
  }
}

module.exports = {
  topic: 'ci',
  command: 'config:get',
  wantsApp: true,
  needsAuth: true,
  description: 'get a CI config var',
  help: `Examples:

    $ heroku ci:config:get RAILS_ENV
    test
`,
  args: [{
    name: 'key',
  }],
  flags: [
    {
      name: 'shell',
      char: 's',
      description: 'output config var in shell format',
    },
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline',
      completion: PipelineCompletion,
    },
  ],
  run: cli.command(run),
}
