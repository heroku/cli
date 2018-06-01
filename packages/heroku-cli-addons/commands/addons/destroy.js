'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const resolve = require('../../lib/resolve')
  const {groupBy, toPairs} = require('lodash')

  let force = context.flags.force || process.env.HEROKU_FORCE === '1'
  if (context.args.length === 0) throw new Error('Missing add-on name')

  let addons = yield context.args.map(name => resolve.addon(heroku, context.app, name))
  for (let addon of addons) {
    // prevent deletion of app when context.app is set but the addon is attached to a different app
    let app = addon.app.name
    if (context.app && app !== context.app) throw new Error(`${cli.color.addon(addon.name)} is on ${cli.color.app(app)} not ${cli.color.app(context.app)}`)
  }
  for (let app of toPairs(groupBy(addons, 'app.name'))) {
    addons = app[1]
    app = app[0]
    yield cli.confirmApp(app, context.flags.confirm)
    for (let addon of addons) {
      let msg = `Destroying ${cli.color.addon(addon.name)} on ${cli.color.app(addon.app.name)}`
      yield cli.action(msg, heroku.request({
        method: 'DELETE',
        path: `/apps/${addon.app.id}/addons/${addon.id}`,
        headers: {'Accept-Expansion': 'plan'},
        body: {force}
      }))
    }
  }
}

let cmd = {
  topic: 'addons',
  description: 'permanently destroy an add-on resource',
  usage: 'addons:destroy [ADDON]... [flags]',
  needsAuth: true,
  wantsApp: true,
  flags: [
    {name: 'force', char: 'f', description: 'allow destruction even if connected to other apps'},
    {name: 'confirm', char: 'c', hasValue: true}
  ],
  variableArgs: true,
  run: cli.command({preauth: true}, co.wrap(run))
}

module.exports = [
  Object.assign({command: 'destroy'}, cmd),
  Object.assign({command: 'remove', hidden: true}, cmd)
]
