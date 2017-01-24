const cli = require('heroku-cli-util')
const co = require('co')
const shellescape = require('shell-escape')
const api = require('../../lib/heroku-api')

function* run (context, heroku) {
  const coupling = yield api.pipelineCoupling(heroku, context.app)
  const config = yield api.configVars(heroku, coupling.pipeline.id)
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
  needsApp: true,
  needsAuth: true,
  description: 'get a CI config var',
  help: `Examples:
$ heroku ci:config:get RAILS_ENV
test
`,
  args: [{
    name: 'key'
  }],
  flags: [{
    name: 'shell',
    char: 's',
    description: 'output config var in shell format'
  }],
  run: cli.command(co.wrap(run))
}
