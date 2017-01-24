const cli = require('heroku-cli-util')
const co = require('co')
const shellescape = require('shell-escape')
const api = require('../../lib/heroku-api')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  const config = yield api.configVars(heroku, coupling.pipeline.id)

  if (context.flags.shell) {
    Object.keys(config).forEach((key) => {
      cli.log(`${key}=${shellescape([config[key]])}`)
    })
  } else if (context.flags.json) {
    cli.styledJSON(config)
  } else {
    cli.styledHeader(`${coupling.pipeline.name} test config vars`)
    cli.styledObject(Object.keys(config).reduce((memo, key) => {
      memo[cli.color.green(key)] = config[key]
      return memo
    }, {}))
  }
}

module.exports = {
  topic: 'ci',
  command: 'config',
  needsApp: true,
  needsAuth: true,
  description: 'display CI config vars',
  flags: [
    {name: 'shell', char: 's', description: 'output config vars in shell format'},
    {name: 'json', description: 'output config vars in json format'}
  ],
  run: cli.command(co.wrap(run))
}
