'use strict'

function start (argv) {
  const cli = require('heroku-cli-util')
  const errHandler = cli.errorHandler()

  process.on('uncaughtException', errHandler)
  process.on('unhandledRejection', errHandler)

  const Context = require('./context')
  const {commands} = require('..')

  let cmd = argv.length < 2 ? ['dashboard'] : argv[1].split(':')
  if (['-v', '--version'].includes(cmd[0].toLowerCase())) cmd = ['version']

  let getCommand = cmd => commands.find(c => c.topic === cmd[0] && c.command === cmd[1])
  let command = getCommand(cmd)
  if (!command) cli.exit(127, 'command not found')

  let context = new Context(command)
  return context.parse(...argv.slice(2))
  .then(() => command.run.bind(context)(context))
  .catch(errHandler)
}

module.exports = start
