'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const addons = require('heroku-cli-addons').resolve
  let {app, args, flags} = context

  let service = co.wrap(function * (name) {
    let addon = yield addons.addon(heroku, app, name)
    if (!addon.plan.name.match(/^heroku-(redis|postgresql)/)) throw new Error('Remote database must be heroku-redis or heroku-postgresql')
    return addon
  })

  const [db, target] = yield [
    fetcher.addon(app, args.database),
    service(args.remote)
  ]

  yield cli.action(`Adding link from ${cli.color.addon(target.name)} to ${cli.color.addon(db.name)}`, co(function * () {
    let link = yield heroku.post(`/client/v11/databases/${db.id}/links`, {
      body: {
        target: target.name,
        as: flags.as
      },
      host: host(db)
    })
    if (link.message) throw new Error(link.message)
    cli.action.done(`done, ${cli.color.cyan(link.name)}`)
  }))
}

module.exports = {
  topic: 'pg',
  command: 'links:create',
  description: 'create a link between data stores',
  help: `Example:

    heroku pg:links:create HEROKU_REDIS_RED HEROKU_POSTGRESQL_CERULEAN`,
  needsApp: true,
  needsAuth: true,
  args: [{name: 'remote'}, {name: 'database'}],
  flags: [{name: 'as', hasValue: true, description: 'name of link to create'}],
  run: cli.command({preauth: true}, co.wrap(run))
}
