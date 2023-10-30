'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const _ = require('lodash')
  const git = require('../../git')(context)

  let app = context.args.app || context.app
  if (!app) throw new Error('No app specified.\nUSAGE: heroku apps:destroy APPNAME')

  context.app = app // make sure context.app is always set for herkou-cli-util

  await heroku.get(`/apps/${app}`)
  await cli.confirmApp(app, context.flags.confirm, `WARNING: This will delete ${cli.color.app(app)} including all add-ons.`)
  let request = heroku.request({
    method: 'DELETE',
    path: `/apps/${app}`,
  })
  await cli.action(`Destroying ${cli.color.app(app)} (including all add-ons)`, request)

  if (git.inGitRepo()) {
    // delete git remotes pointing to this app
    _(await git.listRemotes())
      .filter(r => git.gitUrl(app) === r[1] || git.sshGitUrl(app) === r[1])
      .map(r => r[0])
      .uniq()
      .forEach(element => {
        git.rmRemote(element)
      })
  }
}

let cmd = {
  description: 'permanently destroy an app',
  help: 'This will also destroy all add-ons on the app.',
  needsAuth: true,
  wantsApp: true,
  args: [{name: 'app', hidden: true, optional: true}],
  flags: [
    {name: 'confirm', char: 'c', hasValue: true},
  ],
  run: cli.command(run),
}

module.exports = [
  Object.assign({topic: 'apps', command: 'destroy'}, cmd),
  Object.assign({hidden: true, topic: 'destroy'}, cmd),
  Object.assign({hidden: true, topic: 'apps', command: 'delete'}, cmd),
]
