'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const host = require('../lib/host')
  const fetcher = require('../lib/fetcher')(heroku)
  let {app, args, flags} = context
  let db = yield fetcher.addon(app, args.database)

  yield cli.confirmApp(app, flags.confirm, `WARNING: Destructive action
${cli.color.addon(db.name)} will lose all of its data
`)

  yield cli.action(`Resetting ${cli.color.addon(db.name)}`, co(function * () {
    yield heroku.put(`/client/v11/databases/${db.id}/reset`, {host: host(db)})
  }))
}

module.exports = {
  topic: 'pg',
  command: 'reset',
  description: 'delete all data in DATABASE',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [{name: 'confirm', char: 'c', hasValue: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}
