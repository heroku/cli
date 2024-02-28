'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../lib/host')
  const util = require('../lib/util')
  const fetcher = require('../lib/fetcher')(heroku)
  let {app, args, flags} = context
  let db = await fetcher.addon(app, args.database)

  if (util.legacyEssentialPlan(db)) throw new Error('pg:upgrade is only available for Essential-* databases and follower databases on Standard-tier and higher plans.')

  let [replica] = await Promise.all([
    heroku.get(`/client/v11/databases/${db.id}`, {host: host(db)}),
  ])

  if (replica.following) {
    let origin = util.databaseNameFromUrl(replica.following, await heroku.get(`/apps/${app}/config-vars`))

    await cli.confirmApp(app, flags.confirm, `WARNING: Destructive action
  ${cli.color.addon(db.name)} will be upgraded to a newer PostgreSQL version, stop following ${origin}, and become writable.

  This cannot be undone.`)
  } else {
    await cli.confirmApp(app, flags.confirm, `WARNING: Destructive action
${cli.color.addon(db.name)} will be upgraded to a newer PostgreSQL version.

  This cannot be undone.`)
  }

  let data = {version: flags.version}

  await cli.action(`Starting upgrade of ${cli.color.addon(db.name)}`, (async function () {
    await heroku.post(`/client/v11/databases/${db.id}/upgrade`, {host: host(db), body: data})
    cli.action.done(`${cli.color.cmd('heroku pg:wait')} to track status`)
  })())
}

module.exports = {
  topic: 'pg',
  command: 'upgrade',
  description: 'For an Essential-* plan, this command upgrades the database to the latest stable PostgreSQL version. For a Standard-tier and higher plan, this command unfollows the parent database before upgrading to the latest stable PostgreSQL version.',
  help: 'to upgrade to another PostgreSQL version, use pg:copy instead',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'confirm', char: 'c', hasValue: true},
    {name: 'version', char: 'v', description: 'PostgreSQL version to upgrade to', hasValue: true},
  ],
  run: cli.command({preauth: true}, run),
}
