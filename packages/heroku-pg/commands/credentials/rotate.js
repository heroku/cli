'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const util = require('../../lib/util')
  const {app, args, flags} = context
  let db = yield fetcher.addon(app, args.database)
  let all = flags.all

  if (all && 'name' in flags) {
    cli.exit(1, 'cannot pass both --all and --name')
  }
  let cred = flags.name || 'default'
  if (util.starterPlan(db) && cred !== 'default') throw new Error('This operation is not supported by Hobby tier databases.')

  yield cli.confirmApp(app, flags.confirm, `WARNING: Destructive action`)

  let body = flags.force ? {host: host(db), force: true} : {host: host(db)}

  if (all) {
    yield cli.action(`Rotating all credentials on ${cli.color.addon(db.name)}`, co(function * () {
      yield heroku.post(`/postgres/v0/databases/${db.name}/credentials_rotation`,
                        body)
    }))
  } else {
    yield cli.action(`Rotating ${cred} on ${cli.color.addon(db.name)}`, co(function * () {
      yield heroku.post(`/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(cred)}/credentials_rotation`,
                        body)
    }))
  }
}

module.exports = {
  topic: 'pg',
  command: 'credentials:rotate',
  description: 'rotate the database credentials',
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'name', char: 'n', description: 'which credentials to rotate (default credentials if not specified)', hasValue: true},
    {name: 'all', description: 'rotate all credentials', hasValue: false},
    {name: 'confirm', char: 'c', hasValue: true},
    {name: 'force', description: 'forces rotating the targeted credentials', hasValue: false}
  ],
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}
