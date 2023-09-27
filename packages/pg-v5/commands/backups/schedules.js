'use strict'

const cli = require('heroku-cli-util')

async function run(context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)
  const {app} = context

  let db = await fetcher.arbitraryAppDB(app)
  let schedules = await heroku.get(`/client/v11/databases/${db.id}/transfer-schedules`, {host: host()})

  if (schedules.length === 0) {
    cli.warn(`No backup schedules found on ${cli.color.app(app)}
Use ${cli.color.cmd('heroku pg:backups:schedule')} to set one up`)
  } else {
    cli.styledHeader('Backup Schedules')
    for (let s of schedules) {
      cli.log(`${cli.color.configVar(s.name)}: daily at ${s.hour}:00 ${s.timezone}`)
    }
  }
}

module.exports = {
  topic: 'pg',
  command: 'backups:schedules',
  description: 'list backup schedule',
  needsApp: true,
  needsAuth: true,
  run: cli.command({preauth: true}, run),
}
