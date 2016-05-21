'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  function getRelease (id) {
    return heroku.get(`/apps/${context.app}/releases/${id}`)
  }

  function getLatestRelease () {
    return heroku.request({
      path: `/apps/${context.app}/releases`,
      partial: true,
      headers: { 'Range': 'version ..; max=2, order=desc' }
    }).then((releases) => releases[1])
  }

  let release
  if (context.args.release) {
    let id = context.args.release.toLowerCase()
    id = id.startsWith('v') ? id.slice(1) : id
    release = yield getRelease(id)
  } else {
    release = yield getLatestRelease()
  }

  yield cli.action(`Rolling back ${cli.color.app(context.app)} to ${cli.color.green('v' + release.version)}`, {success: false}, co(function * () {
    let latest = yield heroku.post(`/apps/${context.app}/releases`, {body: {release: release.id}})
    cli.action.done(`done, ${cli.color.green('v' + latest.version)}`)
    cli.warn(`Rollback affects code and config vars; it doesn't add or remove addons.
To undo, run: ${cli.color.cmd('heroku rollback v' + (latest.version - 1))}`)
  }))
}

module.exports = {
  topic: 'releases',
  command: 'rollback',
  description: 'rollback to a previous release',
  help: 'If RELEASE is not specified, it will rollback one release',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'release', optional: true}],
  run: cli.command(co.wrap(run))
}
