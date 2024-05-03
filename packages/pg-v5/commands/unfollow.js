'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const host = require('../lib/host')
  const util = require('../lib/util')
  const fetcher = require('../lib/fetcher')(heroku)
  let {app, args, flags} = context
  let db = await fetcher.addon(app, args.database)

  let replica = await heroku.get(`/client/v11/databases/${db.id}`, {host: host(db)})

  if (!replica.following) throw new Error(`${cli.color.addon(db.name)} is not a follower`)

  let origin = util.databaseNameFromUrl(replica.following, await heroku.get(`/apps/${app}/config-vars`))
  await cli.confirmApp(app, flags.confirm, `WARNING: Destructive action
${cli.color.addon(db.name)} will become writeable and no longer follow ${origin}. This cannot be undone.
`)

  await cli.action(`${cli.color.addon(db.name)} unfollowing`, (async function () {
    await heroku.put(`/client/v11/databases/${db.id}/unfollow`, {host: host(db)})
  })())
}

module.exports = {
  topic: 'pg',
  command: 'unfollow',
  description: 'stop a replica from following and make it a writeable database',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database'}],
  flags: [{name: 'confirm', char: 'c', hasValue: true}],
  run: cli.command({preauth: true}, run),
}
