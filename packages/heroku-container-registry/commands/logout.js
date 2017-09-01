const cli = require('heroku-cli-util')
const log = require('../lib/log')
const Sanbashi = require('../lib/sanbashi')

module.exports = function (topic) {
  return {
    topic: topic,
    command: 'logout',
    flags: [{name: 'verbose', char: 'v', hasValue: false}],
    description: 'log out from Heroku Container Registry',
    needsApp: false,
    needsAuth: false,
    run: cli.command(logout)
  }
}

async function logout (context, heroku) {
  let herokuHost = process.env.HEROKU_HOST || 'heroku.com'
  let registry = `registry.${ herokuHost }`

  try {
    let user = await dockerLogout(registry, context.flags.verbose)
  }
  catch (err) {
    cli.error(`Error: docker logout exited with ${ err }`)
  }
}

function dockerLogout (registry, verbose) {
  let args = [
    'logout',
    registry
  ]
  log(verbose, args)
  return Sanbashi.cmd('docker', args)
}
