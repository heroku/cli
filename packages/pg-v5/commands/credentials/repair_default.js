'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const util = require('../../lib/util')

  const { app, args, flags } = context

  let db = yield fetcher.addon(app, args.database)
  if (util.starterPlan(db)) throw new Error('This operation is not supported by Hobby tier databases.')

  yield cli.confirmApp(app, flags.confirm, `WARNING: Destructive Action
Ownership of all database objects owned by additional credentials will be transferred to the default credential.
This command will also grant the default credential admin option for all additional credentials.
`)

  yield cli.action(`Resetting permissions and object ownership for default role to factory settings`, co(function * () {
    yield heroku.post(`/postgres/v0/databases/${db.name}/repair-default`, { host: host(db) })
  }))
}

module.exports = {
  topic: 'pg',
  command: 'credentials:repair-default',
  description: 'repair the permissions of the default credential within database',
  needsApp: true,
  needsAuth: true,
  help: `Example:

    heroku pg:credentials:repair-default postgresql-something-12345
`,
  args: [{ name: 'database', optional: true }],
  flags: [
    { name: 'confirm', char: 'c', hasValue: true }
  ],
  run: cli.command({ preauth: true }, co.wrap(run))
}
