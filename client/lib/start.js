'use strict'

const cli = require('heroku-cli-util')
const errHandler = cli.errorHandler({debug: true})

process.on('uncaughtException', errHandler)
process.on('unhandledRejection', errHandler)

const Context = require('./context')
const {argv} = process
const {commands} = require('..')

let cmd = argv.length < 3 ? ['dashboard'] : argv[2].split(':')
if (['-v', '--version'].includes(cmd[0].toLowerCase())) cmd = ['version']
let getCommand = cmd => commands.find(c => c.topic === cmd[0] && c.command === cmd[1])
let command = getCommand(cmd)
if (!command) {
  cli.error('command not found')
  process.exit(127)
}
let context = new Context({argv: argv.slice(3), command})
Promise.resolve(command.run(context))
.catch(errHandler)
