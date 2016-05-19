'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const _ = require('lodash')
  const git = require('../../lib/git')(context)

  let app = context.args.app || context.app
  if (!app) throw new Error('No app specified.\nUSAGE: heroku apps:destroy APPNAME')
  yield heroku.get(`/apps/${app}`)
  yield cli.confirmApp(app, context.flags.confirm, `WARNING: This will delete ${cli.color.app(app)} including all add-ons.`)
  let request = heroku.request({
    method: 'DELETE',
    path: `/apps/${app}`
  })
  yield cli.action(`Destroying ${cli.color.app(app)} (including all add-ons)`, request)

  if (git.inGitRepo()) {
    // delete git remotes pointing to this app
    _(yield git.listRemotes())
      .filter((r) => git.gitUrl(app) === r[1] || git.sshGitUrl(app) === r[1])
      .map((r) => r[0])
      .uniq()
      .forEach(git.rmRemote)
  }
}

let cmd = {
  topic: 'apps',
  command: 'destroy',
  description: 'permanently destroy an app',
  help: 'This will also destroy all add-ons on the app.',
  needsAuth: true,
  wantsApp: true,
  args: [{name: 'app', hidden: true, optional: true}],
  flags: [
    {name: 'confirm', char: 'c', hasValue: true}
  ],
  run: cli.command(co.wrap(run))
}

module.exports.apps = cmd
module.exports.root = Object.assign({}, cmd, {topic: 'destroy', command: null})
module.exports.delete = Object.assign({}, cmd, {topic: 'apps', command: 'delete'})
