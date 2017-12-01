'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  let {app, args} = context

  let dbs
  if (args.database) dbs = yield [fetcher.addon(app, args.database)]
  else dbs = yield fetcher.all(app)

  if (!dbs.length) throw new Error(`No databases on ${cli.color.app(app)}`)

  dbs = yield dbs.map(db => {
    db.links = heroku.get(`/client/v11/databases/${db.id}/links`, {host: host(db)})
    return db
  })

  let once
  dbs.forEach(db => {
    if (once) cli.log()
    else once = true
    cli.styledHeader(cli.color.addon(db.name))
    if (db.links.message) return cli.log(db.links.message)
    if (!db.links.length) return cli.log('No data sources are linked into this database')
    db.links.forEach(link => {
      cli.log(`\n * ${cli.color.cyan(link.name)}`)
      link.remote = `${cli.color.configVar(link.remote.attachment_name)} (${cli.color.addon(link.remote.name)})`
      delete link.id
      delete link.name
      cli.styledObject(link)
    })
  })
}

module.exports = {
  topic: 'pg',
  command: 'links',
  description: 'lists all databases and information on link',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  run: cli.command({preauth: true}, co.wrap(run))
}
