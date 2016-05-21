'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context) {
  if (context.flags.restart) throw new Error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego')
  if (context.flags.concurrency) throw new Error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego')

  process.argv = ['', 'heroku local', 'start']

  if (context.flags.procfile) process.argv.push('--procfile', context.flags.procfile)
  if (context.flags.env) process.argv.push('--env', context.flags.env)
  if (context.flags.port) process.argv.push('--port', context.flags.port)
  if (context.args.processname) process.argv.push(context.args.processname)

  require('foreman/nf.js')
}

module.exports = {
  topic: 'local',
  command: 'start',
  description: 'run heroku app locally',
  default: true,
  help: `Start the application specified by a Procfile (defaults to ./Procfile)

Examples:

  heroku local
  heroku local web
  heroku local -f Procfile.test -e .env.test`,
  args: [{name: 'processname', optional: true}],
  flags: [
    {name: 'procfile', char: 'f', hasValue: true, description: 'use a different Procfile'},
    {name: 'env', char: 'e', hasValue: true, description: 'location of env file (defaults to .env)'},
    {name: 'port', char: 'p', hasValue: true, description: 'port to listen on'},
    {name: 'restart', char: 'r', hasValue: false, hidden: true, description: 'restart process if it dies'},
    {name: 'concurrency', char: 'c', hasValue: true, hidden: true, description: 'number of processes to start'}
  ],
  run: cli.command(co.wrap(run))
}
