'use strict'

process.on('uncaughtException', err => console.error(err.stack))
process.on('unhandledRejection', err => console.error(err.stack))

const commands = require('./commands')
const cli = require('heroku-cli-util')
const Context = require('./context')
const {argv} = process

if (argv.length < 3) {
  cli.error('TODO: show help')
  process.exit(0)
}

let cmd = argv[2].split(':')
let command = commands.find(c => c.topic === cmd[0] && c.command === cmd[1])
if (!command) {
  cli.error('command not found')
  process.exit(127)
}
let context = new Context({argv: argv.slice(3), command})
command.run(context)
.catch(cli.errorHandler({debug: true}))
