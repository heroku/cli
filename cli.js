const plugins = require('./lib/plugins')
let argv = process.argv.slice(2)
argv.unshift('heroku')

async function help () {
  await run(require('./lib/commands/help'))
}

async function run (Command) {
  if (!Command) return
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
}

async function main (args) {
  try {
    if (argv.length < 2) await help()
    await run(plugins.commands.find(argv[1]))
    plugins.load()
    await run(plugins.commands.find(argv[1]))
    await help()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

module.exports = main()
