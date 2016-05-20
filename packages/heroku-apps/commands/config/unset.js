'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const reduce = require('lodash.reduce')

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

  let vars = context.args.map((v) => cli.color.configVar(v)).join(', ')

  yield cli.action(`Unsetting ${vars} and restarting ${cli.color.app(context.app)}`, {success: false}, co(function * () {
    yield heroku.request({
      method: 'patch',
      path: `/apps/${context.app}/config-vars`,
      // body will be like {FOO: null, BAR: null}
      body: reduce(context.args, (vars, v) => { vars[v] = null; return vars }, {})
    })
    let release = yield lastRelease()
    cli.action.done('done, ' + cli.color.release(`v${release.version}`))
  }))
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
module.exports.remove = Object.assign({}, cmd)
module.exports.remove.command = 'remove'
