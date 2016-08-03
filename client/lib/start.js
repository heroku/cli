'use strict'

process.on('uncaughtException', err => console.error(err.stack))
process.on('unhandledRejection', err => console.error(err.stack))

const cli = require('heroku-cli-util')
const Context = require('./context')
const {argv} = process

if (argv.length < 3) require('./commands/help').run()

let cmd = argv[2].split(':')
let commands = require('./commands')
let getCommand = cmd => commands.find(c => c.topic === cmd[0] && c.command === cmd[1])
let command = getCommand(cmd)
if (!command) {
  require('./plugins').load()
  command = getCommand(cmd)
  if (!command) {
    cli.error('command not found')
    process.exit(127)
  }
}
let context = new Context({argv: argv.slice(3), command})
command.run(context)
.catch(cli.errorHandler({debug: true}))
