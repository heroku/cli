const plugins = require('./lib/plugins')
let argv = process.argv.slice(2)
argv.unshift('heroku')

function onexit (options) {
  const ansi = require('ansi-escapes')
  process.stderr.write(ansi.cursorShow)
  if (options.exit) process.exit(1)
}

process.on('exit', onexit)
process.on('SIGINT', onexit.bind(null, {exit: true}))
process.on('uncaughtException', onexit.bind(null, {exit: true}))

async function main () {
  let command
  try {
    let Command = plugins.commands.find(argv[1])
    if (!Command) Command = plugins.load().commands.find(argv[1])
    if (!Command) Command = require('./lib/commands/help')
    if (!Command._version) {
      // v5 command
      const {convertLegacy} = require('heroku-cli-command')
      Command = convertLegacy(Command)
    }
    command = new Command({argv})
    await command.init()
    await command.run()
    await command.done()
    process.exit(0)
  } catch (err) {
    if (command) command.error(err)
    else console.error(err)
    process.exit(1)
  }
}

module.exports = main()
