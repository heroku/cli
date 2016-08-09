'use strict'

const cli = require('heroku-cli-util')
const errHandler = cli.errorHandler()

process.on('uncaughtException', errHandler)
process.on('unhandledRejection', errHandler)

const Context = require('./context')
const {argv} = process
const {commands} = require('..')

let cmd = argv.length < 3 ? ['dashboard'] : argv[2].split(':')
if (['-v', '--version'].includes(cmd[0].toLowerCase())) cmd = ['version']

let getCommand = cmd => commands.find(c => c.topic === cmd[0] && c.command === cmd[1])
let command = getCommand(cmd)
if (!command) cli.fatal('command not found', 127)

let context = new Context(command)
context.parse(...argv.slice(3))
.then(() => command.run.bind(context)(context))
.catch(errHandler)
