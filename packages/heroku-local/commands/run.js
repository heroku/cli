'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context) {
  if (context.args.length < 1) {
    cli.error('Usage: heroku local:run [COMMAND]\nMust specify command to run')
    process.exit(-1)
  }

  process.argv = ['', 'heroku local:run', 'run']

  if (context.flags.env) process.argv.push('--env', context.flags.env)
  if (context.flags.port) process.argv.push('--port', context.flags.port)

  process.argv.push('--') // disable node-foreman flag parsing
  process.argv.push(...context.args)

  require('foreman/nf.js')
}

module.exports = {
  topic: 'local',
  command: 'run',
  description: 'run a one-off command',
  help: `Example:

  heroku local:run bin/migrate`,
  variableArgs: true,
  flags: [
    {name: 'env', char: 'e', hasValue: true},
    {name: 'port', char: 'p', hasValue: true}
  ],
  run: cli.command(co.wrap(run))
}
