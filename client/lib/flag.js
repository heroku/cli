'use strict'

const cli = require('heroku-cli-util')

function setApp (app) {
  // TODO: check --remote
  this.app = this.flags.app
}

function setOrg (org) {
  this.org = this.flags.org
}

function fetchApp (need) {
  return function () {
    let app = process.env.HEROKU_APP
    // TODO: look up git remote
    if (need && !app) throw new Error('No app specified')
    return app
  }
}

function fetchOrg (need) {
  return function () {
    let org = process.env.HEROKU_ORGANIZATION
    if (need && !org) throw new Error(`No org specified.\nRun this command with ${cli.color.cmd('--org')} or by setting ${cli.color.configVar('HEROKU_ORGANIZATION')}`)
    return org
  }
}

exports.addHerokuFlags = command => {
  // TODO: deprecate this at some point in favor of explicit before filters

  command.flags = command.flags || []
  command.before = command.before || []
  if (command.needsAuth) command.before.unshift(cli.auth)
  if (command.wantsOrg || command.needsOrg) {
    command.flags.push({
      name: 'org',
      char: 'o',
      description: 'organization to use',
      hasValue: true,
      required: command.needsOrg,
      default: fetchOrg(command.needsOrg)
    })
    command.before.push(setOrg)
  }
  if (command.wantsApp || command.needsApp) {
    command.flags.push({
      name: 'app',
      char: 'a',
      description: 'app to run command against',
      hasValue: true,
      required: command.needsApp,
      default: fetchApp(command.needsApp)
    })
    command.flags.push({
      name: 'remote',
      char: 'r',
      description: 'git remote pointing to app to run command against\nalternative for --app',
      hasValue: true
    })
    command.before.push(setApp)
  }
}
