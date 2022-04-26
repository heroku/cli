'use strict'

const cli = require('heroku-cli-util')

const TZ = {
  'PST': 'America/Los_Angeles',
  'PDT': 'America/Los_Angeles',
  'MST': 'America/Boise',
  'MDT': 'America/Boise',
  'CST': 'America/Chicago',
  'CDT': 'America/Chicago',
  'EST': 'America/New_York',
  'EDT': 'America/New_York',
  'Z': 'UTC',
  'GMT': 'Europe/London',
  'BST': 'Europe/London',
  'CET': 'Europe/Paris',
  'CEST': 'Europe/Paris'
}

function parse (at) {
  let m = at.match(/^([0-2]?[0-9]):00 ?(\S*)$/)
  if (!m) throw new Error("Invalid schedule format: expected --at '[HOUR]:00 [TIMEZONE]'")
  let [, hour, timezone] = m

  return { hour, timezone: TZ[timezone.toUpperCase()] || timezone || 'UTC' }
}

async function run(context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)

  const { app, args, flags } = context

  let schedule = parse(flags.at)

  let attachment = await fetcher.attachment(app, args.database)
  let db = attachment.addon

  let at = cli.color.cyan(`${schedule.hour}:00 ${schedule.timezone}`)

  let dbInfo = await heroku.request({
    host: host(db),
    method: 'get',
    path: `/client/v11/databases/${db.id}`
  }).catch(err => {
    if (err.statusCode !== 404) throw err
    cli.exit(1, `${cli.color.addon(db.name)} is not yet provisioned.\nRun ${cli.color.cmd('heroku addons:wait')} to wait until the db is provisioned.`)
  })

  if (dbInfo) {
    let dbProtected = /On/.test(dbInfo.info.find(attribute => attribute.name === 'Continuous Protection').values[0])
    if (dbProtected) {
      cli.warn('Continuous protection is already enabled for this database. Logical backups of large databases are likely to fail.')
      cli.warn('See https://devcenter.heroku.com/articles/heroku-postgres-data-safety-and-continuous-protection#physical-backups-on-heroku-postgres.')
    }
  }

  await cli.action(`Scheduling automatic daily backups of ${cli.color.addon(db.name)} at ${at}`, async function () {
    // We've been using config var name as schedule_name historically
    schedule.schedule_name = attachment.name + '_URL'

    await heroku.post(`/client/v11/databases/${db.id}/transfer-schedules`, {
      body: schedule,
      host: host(db)
    })
  }())
}

module.exports = {
  topic: 'pg',
  command: 'backups:schedule',
  description: 'schedule daily backups for given database',
  needsApp: true,
  needsAuth: true,
  args: [
    { name: 'database', optional: true }
  ],
  flags: [
    { name: 'at', required: true, hasValue: true, description: "at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00 [TIMEZONE]'" }
  ],
  run: cli.command({ preauth: true }, run)
}
