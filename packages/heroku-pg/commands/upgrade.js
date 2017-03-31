'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const host = require('../lib/host')
  const util = require('../lib/util')
  const fetcher = require('../lib/fetcher')(heroku)
  let {app, args, flags} = context
  let db = yield fetcher.addon(app, args.database)

  if (util.starterPlan(db)) throw new Error('pg:upgrade is only available for follower production databases')

  let [replica, status] = yield [
    heroku.get(`/client/v11/databases/${db.id}`, {host: host(db)}),
    heroku.get(`/client/v11/databases/${db.id}/upgrade_status`, {host: host(db)})
  ]

  if (status.error) throw new Error(status.error)
  let origin = util.databaseNameFromUrl(replica.following, yield heroku.get(`/apps/${app}/config-vars`))

  yield cli.confirmApp(app, flags.confirm, `WARNING: Destructive action
${cli.color.addon(db.name)} will be upgraded to a newer PostgreSQL version, stop following ${origin}, and become writable.

This cannot be undone.`)

  yield cli.action(`Starting upgrade of ${cli.color.addon(db.name)}`, co(function * () {
    yield heroku.post(`/client/v11/databases/${db.id}/upgrade`, {host: host(db)})
    cli.action.done(`${cli.color.cmd('heroku pg:wait')} to track status`)
  }))
}

module.exports = {
  topic: 'pg',
  command: 'upgrade',
  description: 'unfollow a database and upgrade it to the latest stable PostgreSQL version',
  help: 'to upgrade to another PostgreSQL version, use pg:copy instead',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'confirm', char: 'c', hasValue: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}
