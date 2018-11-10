'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const { app } = context

  let db = yield fetcher.arbitraryAppDB(app)
  let schedules = yield heroku.get(`/client/v11/databases/${db.id}/transfer-schedules`, { host: host(db) })

  if (!schedules.length) {
    throw new Error(`No backup schedules found on ${cli.color.app(app)}
Use ${cli.color.cmd('heroku pg:backups:schedule')} to set one up`)
  }

  cli.styledHeader('Backup Schedules')
  for (let s of schedules) {
    cli.log(`${cli.color.configVar(s.name)}: daily at ${s.hour}:00 ${s.timezone}`)
  }
}

module.exports = {
  topic: 'pg',
  command: 'backups:schedules',
  description: 'list backup schedule',
  needsApp: true,
  needsAuth: true,
  run: cli.command({ preauth: true }, co.wrap(run))
}
