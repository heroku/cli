'use strict'

let cli = require('@heroku/heroku-cli-util')
let helpers = require('../lib/helpers')
let Dyno = require('../lib/dyno')

async function run(context, heroku) {
  context.args.unshift('rake')
  let opts = {
    heroku: heroku,
    app: context.app,
    command: helpers.buildCommand(context.args),
    size: context.flags.size,
    'exit-code': context.flags['exit-code'],
    env: context.flags.env,
    'no-tty': context.flags['no-tty'],
    attach: true,
  }

  let dyno = new Dyno(opts)
  try {
    await dyno.start()
  } catch (error) {
    if (error.exitCode) {
      cli.error(error)
      process.exit(error.exitCode)
    } else throw error
  }
}

module.exports = {
  topic: 'rake',
  hidden: true,
  variableArgs: true,
  needsAuth: true,
  needsApp: true,
  flags: [
    {name: 'size', char: 's', description: 'dyno size', hasValue: true},
    {name: 'exit-code', char: 'x', description: 'passthrough the exit code of the remote command'},
    {name: 'env', char: 'e', description: "environment variables to set (use ';' to split multiple vars)", hasValue: true},
    {name: 'no-tty', description: 'force the command to not run in a tty', hasValue: false},
  ],
  run: cli.command(run),
}
