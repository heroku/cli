const plugins = require('./lib/plugins')
let argv = process.argv.slice(2)
argv.unshift('heroku')

async function main () {
  try {
    let Command = plugins.commands.find(argv[1])
    if (!Command) Command = plugins.load().commands.find(argv[1])
    if (!Command) Command = require('./lib/commands/help')
    if (!Command._version) {
      // v5 command
      const {convertLegacy} = require('heroku-cli-command')
      Command = convertLegacy(Command)
    }
    let command = new Command({argv})
    await command.init()
    await command.run()
    await command.done()
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

module.exports = main()
