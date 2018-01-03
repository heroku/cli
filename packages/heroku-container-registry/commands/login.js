const cli = require('heroku-cli-util')
const log = require('../lib/log')
const Sanbashi = require('../lib/sanbashi')

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'login',
    flags: [{name: 'verbose', char: 'v', hasValue: false}],
    description: 'log in to Heroku Container Registry',
    help: `Usage:
        heroku container:login`,
    needsApp: false,
    needsAuth: true,
    run: cli.command(login)
  }
}

async function login (context, heroku) {
  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${ herokuHost }`
  let password = context.auth.password

  try {
    let user = await dockerLogin(registry, password, context.flags.verbose)
  }
  catch (err) {
    cli.error(`Error: docker login exited with ${ err }`)
    cli.hush(err.stack || err)
    cli.exit(1)
  }
}

async function dockerLogin (registry, password, verbose) {
  let [major, minor] = await Sanbashi.version()

  if (major > 17 || major == 17 && minor >= 1) {
    return await dockerLoginStdin(registry, password, verbose)
  }
  return await dockerLoginArgv(registry, password, verbose)
}

function dockerLoginStdin(registry, password, verbose) {
  let args = [
    'login',
    '--username=_',
    '--password-stdin',
    registry
  ]

  log(verbose, args)
  return Sanbashi.cmd('docker', args, {input: password})
}

function dockerLoginArgv(registry, password, verbose) {
  let args = [
    'login',
    '--username=_',
    `--password=${password}`,
    registry
  ]

  log(verbose, args)
  return Sanbashi.cmd('docker', args)
}
