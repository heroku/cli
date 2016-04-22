'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let _ = require('lodash')
let extend = require('util')._extend

function * run (context, heroku) {
  function lastRelease () {
    return heroku.request({
      method: 'GET',
      partial: true,
      path: `/apps/${context.app}/releases`,
      headers: {Range: 'version ..; order=desc,max=1'}
    }).then((releases) => releases[0])
  }

  if (context.args.length === 0) {
    cli.error('Usage: heroku config:unset KEY1 [KEY2 ...]\nMust specify KEY to unset.')
    process.exit(1)
  }

  let release
  let vars = context.args.map((v) => cli.color.configVar(v)).join(', ')

  yield cli.action(`Unsetting ${vars} and restarting ${cli.color.app(context.app)}`, {success: false}, co(function * () {
    yield heroku.request({
      method: 'patch',
      path: `/apps/${context.app}/config-vars`,
      // body will be like {FOO: null, BAR: null}
      body: _.reduce(context.args, (vars, v) => { vars[v] = null; return vars }, {})
    })
    release = yield lastRelease()
  }))

  cli.console.error('done, ' + cli.color.release(`v${release.version}`))
}

let cmd = {
  topic: 'config',
  command: 'unset',
  description: 'unset one or more config vars',
  help: `
 Examples:

 $ heroku config:unset RAILS_ENV
 Unsetting RAILS_ENV and restarting example... done, v10

 $ heroku config:unset RAILS_ENV RACK_ENV
 Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10`,
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command({preauth: true}, co.wrap(run))
}

module.exports.unset = cmd
module.exports.remove = extend({}, cmd)
module.exports.remove.command = 'remove'
