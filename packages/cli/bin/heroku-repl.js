const {Config} = require('@oclif/core')
const root = require.resolve('../package.json')
const config = new Config({root})
const flagsByName = new Map()
async function * commandGenerator() {
  while (true) {
    const argv = await new Promise(resolve => {
      process.stdin.once('data', resolve)
    })
    yield argv.toString().trim().split(' ')
  }
}

module.exports.herokuRepl = async function (config) {
  process.stderr.write('Welcome to the Heroku Terminal!\n$ ')

  for await (const input of commandGenerator()) {
    const [command, ...argv] = input
    if (command === '.exit') {
      process.exit(0)
    }

    if (command.startsWith('set')) {
      flagsByName.set(argv[0], argv[1])
      process.stderr.write(`setting --app to "${argv[1]}"\n$ `)
      continue
    }

    const commandMeta = config.findCommand(command)
    if (!commandMeta) {
      process.stderr.write(`"${command}" not a valid command\n$ `)
      continue
    }

    try {
      const {flags} = commandMeta
      if (flags.app && flagsByName.has('app') && !argv?.includes('--app')) {
        argv.push('--app', flagsByName.get('app'))
      }

      await config.runCommand(command, argv)
    } catch (error) {
      process.stderr.write(error.message)
    }

    process.stderr.write('\n$ ')
  }
}
