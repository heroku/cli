'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  if (context.args.length === 0) {
    cli.exit(1, 'Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
  }

  const reduce = require('lodash.reduce')
  const pickBy = require('lodash.pickby')
  const mapKeys = require('lodash.mapkeys')

  function lastRelease () {
    return heroku.request({
      method: 'GET',
      partial: true,
      path: `/apps/${context.app}/releases`,
      headers: {Range: 'version ..; order=desc,max=1'}
    }).then((releases) => releases[0])
  }

  let vars = reduce(context.args, function (vars, v) {
    let idx = v.indexOf('=')
    if (idx === -1) {
      cli.error(`${cli.color.cyan(v)} is invalid. Must be in the format ${cli.color.cyan('FOO=bar')}.`)
      process.exit(1)
    }
    vars[v.slice(0, idx)] = v.slice(idx + 1)
    return vars
  }, {})

  let config

  yield cli.action(
    `Setting ${context.args.map((v) => cli.color.configVar(v.split('=')[0])).join(', ')} and restarting ${cli.color.app(context.app)}`,
    {success: false},
    co(function * () {
      config = yield heroku.request({
        method: 'patch',
        path: `/apps/${context.app}/config-vars`,
        body: vars
      })
      let release = yield lastRelease()
      cli.action.done(`done, ${cli.color.release('v' + release.version)}`)
    })
  )

  config = pickBy(config, (_, k) => vars[k])
  config = mapKeys(config, (_, k) => cli.color.green(k))
  cli.styledObject(config)
}

let cmd = {
  topic: 'config',
  command: 'set',
  description: 'set one or more config vars',
  help: `Examples:

 $ heroku config:set RAILS_ENV=staging
 Setting config vars and restarting example... done, v10
 RAILS_ENV: staging

 $ heroku config:set RAILS_ENV=staging RACK_ENV=staging
 Setting config vars and restarting example... done, v11
 RAILS_ENV: staging
 RACK_ENV:  staging
 `,
  needsApp: true,
  needsAuth: true,
  variableArgs: true,
  run: cli.command({preauth: true}, co.wrap(run))
}

module.exports.set = cmd
module.exports.add = Object.assign({}, cmd)
module.exports.add.command = 'add'
