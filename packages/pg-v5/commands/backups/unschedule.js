'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)

  const { app, args } = context
  let db = args.database

  if (!args.database) {
    let appDB = yield fetcher.arbitraryAppDB(app)
    let schedules = yield heroku.get(`/client/v11/databases/${appDB.id}/transfer-schedules`, { host: host(appDB) })
    if (!schedules.length) throw new Error(`No schedules on ${cli.color.app(app)}`)
    if (schedules.length > 1) {
      throw new Error(`Specify schedule on ${cli.color.app(app)}. Existing schedules: ${schedules.map(s => cli.color.configVar(s.name)).join(', ')}`)
    }
    db = schedules[0].name
  }

  yield cli.action(`Unscheduling ${cli.color.configVar(db)} daily backups`, co(function * () {
    let addon = yield fetcher.addon(app, db)
    let schedules = yield heroku.get(`/client/v11/databases/${addon.id}/transfer-schedules`, { host: host(addon) })
    let schedule = schedules.find(s => s.name.match(new RegExp(db, 'i')))
    if (!schedule) throw new Error(`No daily backups found for ${cli.color.addon(addon.name)}`)
    yield heroku.delete(`/client/v11/databases/${addon.id}/transfer-schedules/${schedule.uuid}`, {
      host: host(addon)
    })
  }))
}

module.exports = {
  topic: 'pg',
  command: 'backups:unschedule',
  description: 'stop daily backups',
  needsApp: true,
  needsAuth: true,
  args: [
    { name: 'database', optional: true }
  ],
  run: cli.command({ preauth: true }, co.wrap(run))
}
