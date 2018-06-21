const cli = require('heroku-cli-util')
const Sanbashi = require('../lib/sanbashi')
const debug = require('../lib/debug')

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
  if (context.flags.verbose) debug.enabled = true
  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${herokuHost}`
  let password = context.auth.password
  if (!password) throw new Error('not logged in')

  try {
    await dockerLogin(registry, password)
  } catch (err) {
    cli.error(`Error: docker login exited with ${err}`, 1)
  }
}

async function dockerLogin (registry, password) {
  let [major, minor] = await Sanbashi.version()

  if (major > 17 || (major === 17 && minor >= 7)) {
    return dockerLoginStdin(registry, password)
  }
  return dockerLoginArgv(registry, password)
}

function dockerLoginStdin (registry, password) {
  let args = [
    'login',
    '--username=_',
    '--password-stdin',
    registry
  ]
  return Sanbashi.cmd('docker', args, {input: password})
}

function dockerLoginArgv (registry, password) {
  let args = [
    'login',
    '--username=_',
    `--password=${password}`,
    registry
  ]
  return Sanbashi.cmd('docker', args)
}
