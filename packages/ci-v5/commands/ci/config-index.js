const cli = require('heroku-cli-util')
const co = require('co')
const shellescape = require('shell-escape')
const api = require('../../lib/heroku-api')
const Utils = require('../../lib/utils')
const PipelineCompletion = require('../../lib/completions')

function* run (context, heroku) {
  const pipeline = yield Utils.getPipeline(context, heroku)
  const config = yield api.configVars(heroku, pipeline.id)

  if (context.flags.shell) {
    Object.keys(config).forEach((key) => {
      cli.log(`${key}=${shellescape([config[key]])}`)
    })
  } else if (context.flags.json) {
    cli.styledJSON(config)
  } else {
    cli.styledHeader(`${pipeline.name} test config vars`)
    cli.styledObject(Object.keys(config).reduce((memo, key) => {
      memo[cli.color.green(key)] = config[key]
      return memo
    }, {}))
  }
}

module.exports = {
  topic: 'ci',
  command: 'config',
  wantsApp: true,
  needsAuth: true,
  description: 'display CI config vars',
  flags: [
    {
      name: 'shell',
      char: 's',
      description: 'output config vars in shell format'
    },
    {
      name: 'json',
      description: 'output config vars in json format'
    },
    {
      name: 'pipeline',
      char: 'p',
      hasValue: true,
      description: 'pipeline',
      completion: PipelineCompletion
    }
  ],
  run: cli.command(co.wrap(run)),
  help: `Example:

    $ heroku ci:config --app murmuring-headland-14719 --json`
}
