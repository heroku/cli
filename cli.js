'use strict'

const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

const plugins = [
  require('heroku-apps'),
  require('heroku-run')
]
const commands = flatten(plugins.map(p => p.commands))
function help () {
  console.error('TODO: implement help')
  process.exit(1)
}

async function run () {
  const argv = process.argv.slice(2)
  argv.unshift('heroku')
  if (argv.length < 2) help()
  const cmd = argv[1].split(':')
  const Command = commands.find(c => cmd[1]
    ? cmd[0] === c.topic && cmd[1] === c.command
    : cmd[0] === c.topic && !c.command
  )

  if (Command) {
    try {
      let command = new Command({argv})
      await command.init()
      await command.run()
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  } else help()
}
run()
