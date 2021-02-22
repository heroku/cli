'use strict'

const cli = require('heroku-cli-util')
let releases = require('../../releases')

async function run(context, heroku) {
  const shellescape = require('shell-escape')
  const statusHelper = require('../../status_helper')
  const { forEach } = require('lodash')

  let release = await releases.FindByLatestOrId(heroku, context.app, context.args.release)

  let config = await heroku.get(`/apps/${context.app}/releases/${release.version}/config-vars`)

  if (context.flags.json) {
    cli.styledJSON(release)
  } else {
    let releaseChange = release.description
    let status = statusHelper.description(release)
    let statusColor = statusHelper.color(release.status)
    if (status !== undefined) {
      releaseChange += ' (' + cli.color[statusColor](status) + ')'
    }

    cli.styledHeader(`Release ${cli.color.cyan('v' + release.version)}`)
    cli.styledObject({
      'Add-ons': release.addon_plan_names,
      Change: releaseChange,
      By: release.user.email,
      When: release.created_at
    })

    cli.log()
    cli.styledHeader(`${cli.color.cyan('v' + release.version)} Config vars`)
    if (context.flags.shell) {
      forEach(config, (v, k) => cli.log(`${k}=${shellescape([v])}`))
    } else {
      cli.styledObject(config)
    }
  }
}

module.exports = {
  topic: 'releases',
  command: 'info',
  description: 'view detailed information for a release',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'release', optional: true }],
  flags: [
    { name: 'json', description: 'output in json format' },
    { name: 'shell', char: 's', description: 'output in shell format' }
  ],
  run: cli.command(run)
}
