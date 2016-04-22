'use strict'

let cli = require('heroku-cli-util')
let shellescape = require('shell-escape')
let co = require('co')

function * run (context, heroku) {
  let configVars = yield heroku.request({path: `/apps/${context.app}/config-vars`})
  let v = configVars[context.args.key]
  if (v === undefined) {
    cli.log('') // match v3 output for missing
  } else {
    if (context.flags.shell) {
      cli.log(`${context.args.key}=${shellescape([v])}`)
    } else {
      cli.log(v)
    }
  }
}

module.exports = {
  topic: 'config',
  command: 'get',
  description: 'display a config value for an app',
  help: `Example:

 $ heroku config:get RAILS_ENV
 production
 `,
  args: [{name: 'key'}],
  flags: [{name: 'shell', char: 's', description: 'output config var in shell format'}],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(run))
}
