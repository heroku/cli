'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const {FileCompletion} = require('@heroku-cli/command/lib/completions')

function * run (context) {
  if (context.args.length < 1) {
    cli.error('Usage: heroku local:run [COMMAND]\nMust specify command to run')
    process.exit(-1)
  }

  let execArgv = ['run']

  if (context.flags.env) execArgv.push('--env', context.flags.env)
  if (context.flags.port) execArgv.push('--port', context.flags.port)

  execArgv.push('--') // disable node-foreman flag parsing
  execArgv.push(...context.args)

  yield require('../lib/fork_foreman')(execArgv)
}

module.exports = {
  topic: 'local',
  command: 'run',
  description: 'run a one-off command',
  examples: '$ heroku local:run bin/migrate',
  variableArgs: true,
  flags: [
    {name: 'env', char: 'e', hasValue: true, completion: FileCompletion},
    {name: 'port', char: 'p', hasValue: true}
  ],
  run: cli.command(co.wrap(run))
}
