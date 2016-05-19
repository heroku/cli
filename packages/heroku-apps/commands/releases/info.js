'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const shellescape = require('shell-escape')
  const statusHelper = require('./status_helper')
  const forEach = require('lodash.foreach')
  // TODO: find out how to get config vars and addons data in apiv3 or deprecate this command
  let id = (context.args.release || 'current').toLowerCase()
  id = id.startsWith('v') ? id.slice(1) : id
  let release
  if (id === 'current') {
    let releases = yield heroku.request({
      path: `/apps/${context.app}/releases`,
      partial: true,
      headers: {
        Range: 'version ..; max=1, order=desc'
      }
    })
    id = releases[0].version
  }

  release = yield {
    v3: heroku.request({
      path: `/apps/${context.app}/releases/${id}`,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3'
      }
    }),
    // TODO: move to use API V3 once an endpoint to fetch a release config vars is available
    v2: heroku.request({
      path: `/apps/${context.app}/releases/${id}`,
      headers: {Accept: 'application/json'}
    }).catch(() => {})
  }

  if (context.flags.json) {
    cli.styledJSON(release.v3)
  } else {
    let releaseChange = release.v3.description
    let status = statusHelper(release.v3.status)
    if (status.content !== undefined) {
      releaseChange += ' (' + cli.color[status.color](status.content) + ')'
    }

    cli.styledHeader(`Release ${cli.color.cyan('v' + release.v3.version)}`)
    cli.styledObject({
      'Add-ons': release.v2 ? release.v2.addons : null,
      Change: releaseChange,
      By: release.v3.user.email,
      When: release.v3.created_at
    })
    if (release.v2 && release.v2.env) {
      cli.log()
      cli.styledHeader(`${cli.color.cyan('v' + release.v3.version)} Config vars`)
      if (context.flags.shell) {
        forEach(release.v2.env, (v, k) => cli.log(`${k}=${shellescape([v])}`))
      } else {
        cli.styledObject(release.v2.env)
      }
    }
  }
}

module.exports = {
  topic: 'releases',
  command: 'info',
  description: 'view detailed information for a release',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'release', optional: true}],
  flags: [
    {name: 'json', description: 'output in json format'},
    {name: 'shell', char: 's', description: 'output in shell format'}
  ],
  run: cli.command(co.wrap(run))
}
