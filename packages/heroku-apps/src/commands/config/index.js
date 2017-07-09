'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const shellescape = require('shell-escape')
  const forEach = require('lodash.foreach')
  const mapKeys = require('lodash.mapkeys')

  let configVars = yield heroku.request({path: `/apps/${context.app}/config-vars`})
  if (context.flags.shell) {
    forEach(configVars, function (v, k) {
      cli.log(`${k}=${shellescape([v])}`)
    })
  } else if (context.flags.json) {
    cli.styledJSON(configVars)
  } else {
    cli.styledHeader(`${context.app} Config Vars`)
    cli.styledObject(mapKeys(configVars, (_, k) => cli.color.configVar(k)))
  }
}

module.exports = {
  topic: 'config',
  description: 'display the config vars for an app',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'shell', char: 's', description: 'output config vars in shell format'},
    {name: 'json', description: 'output config vars in json format'}
  ],
  run: cli.command(co.wrap(run))
}
