'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const shellescape = require('shell-escape')
  const statusHelper = require('./status_helper')
  const forEach = require('lodash.foreach')
  let id = (context.args.release || 'current').toLowerCase()
  id = id.startsWith('v') ? id.slice(1) : id
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

  let data = yield {
    release: heroku.request({
      path: `/apps/${context.app}/releases/${id}`,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3'
      }
    }),
    config: heroku.request({
      path: `/apps/${context.app}/releases/${id}/config-vars`,
      headers: {
        Accept: 'application/vnd.heroku+json; version=3'
      }
    })
  }

  if (context.flags.json) {
    cli.styledJSON(data.release)
  } else {
    let releaseChange = data.release.description
    let status = statusHelper.description(data.release)
    let statusColor = statusHelper.color(data.release.status)
    if (status !== undefined) {
      releaseChange += ' (' + cli.color[statusColor](status) + ')'
    }

    cli.styledHeader(`Release ${cli.color.cyan('v' + data.release.version)}`)
    cli.styledObject({
      'Add-ons': data.release.addon_plan_names,
      Change: releaseChange,
      By: data.release.user.email,
      When: data.release.created_at
    })

    cli.log()
    cli.styledHeader(`${cli.color.cyan('v' + data.release.version)} Config vars`)
    if (context.flags.shell) {
      forEach(data.config, (v, k) => cli.log(`${k}=${shellescape([v])}`))
    } else {
      cli.styledObject(data.config)
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
