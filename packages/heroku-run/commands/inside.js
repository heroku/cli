'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const helpers = require('../lib/helpers')
const Dyno = require('../lib/dyno')

function * run (context, heroku) {
  if (context.args.length < 2) throw new Error('Usage: heroku run:inside DYNO COMMAND\n\nExample: heroku run:inside web.1 bash')
  let opts = {
    heroku: heroku,
    app: context.app,
    dyno: context.args[0],
    command: helpers.buildCommand(context.args.slice(1)),
    'exit-code': context.flags['exit-code'],
    env: context.flags.env
  }

  let dyno = new Dyno(opts)
  yield dyno.start()
}

module.exports = {
  topic: 'run',
  command: 'inside',
  hidden: true,
  description: 'run a one-off process inside an existing heroku dyno',
  help: `
Examples:

  $ heroku run:inside web.1 bash
  Running bash on web.1.... up
  ~ $
`,
  variableArgs: true,
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'exit-code', description: 'passthrough the exit code of the remote command'},
    {name: 'env', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true}
  ],
  run: cli.command(co.wrap(run))
}
