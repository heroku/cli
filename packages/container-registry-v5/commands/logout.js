const cli = require('heroku-cli-util')
const Sanbashi = require('../lib/sanbashi')
const debug = require('../lib/debug')

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'logout',
    flags: [{name: 'verbose', char: 'v', hasValue: false}],
    description: 'log out from Heroku Container Registry',
    needsApp: false,
    needsAuth: false,
    run: cli.command(logout),
  }
}

async function logout(context) {
  if (context.flags.verbose) debug.enabled = true
  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${herokuHost}`

  try {
    await dockerLogout(registry)
  } catch (error) {
    cli.error(`Error: docker logout exited with ${error}`)
  }
}

function dockerLogout(registry) {
  let args = [
    'logout',
    registry,
  ]
  return Sanbashi.cmd('docker', args)
}
