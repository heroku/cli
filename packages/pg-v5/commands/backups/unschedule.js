'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)

  const {app, args} = context
  let db = args.database

  if (!args.database) {
    let appDB = await fetcher.arbitraryAppDB(app)
    let schedules = await heroku.get(`/client/v11/databases/${appDB.id}/transfer-schedules`, {host: host()})
    if (schedules.length === 0) throw new Error(`No schedules on ${cli.color.app(app)}`)
    if (schedules.length > 1) {
      throw new Error(`Specify schedule on ${cli.color.app(app)}. Existing schedules: ${schedules.map(s => cli.color.configVar(s.name)).join(', ')}`)
    }

    db = schedules[0].name
  }

  await cli.action(`Unscheduling ${cli.color.configVar(db)} daily backups`, (async function () {
    let addon = await fetcher.addon(app, db)
    let schedules = await heroku.get(`/client/v11/databases/${addon.id}/transfer-schedules`, {host: host()})
    let schedule = schedules.find(s => s.name.match(new RegExp(db, 'i')))
    if (!schedule) throw new Error(`No daily backups found for ${cli.color.addon(addon.name)}`)
    await heroku.delete(`/client/v11/databases/${addon.id}/transfer-schedules/${schedule.uuid}`, {
      host: host(),
    })
  })())
}

module.exports = {
  topic: 'pg',
  command: 'backups:unschedule',
  description: 'stop daily backups',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'database', optional: true},
  ],
  run: cli.command({preauth: true}, run),
}
