'use strict'

const co = require('co')
const cli = require('heroku-cli-util')
const util = require('../../lib/util')

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

  return {hour, timezone: TZ[timezone.toUpperCase()] || timezone || 'UTC'}
}

function * run (context, heroku) {
  const host = require('../../lib/host')
  const fetcher = require('../../lib/fetcher')(heroku)

  const {app, args, flags} = context

  let schedule = parse(flags.at)

  let attachment = yield fetcher.attachment(app, args.database)
  let db = attachment.addon

  let at = cli.color.cyan(`${schedule.hour}:00 ${schedule.timezone}`)

  yield cli.action(`Scheduling automatic daily backups of ${cli.color.addon(db.name)} at ${at}`, co(function * () {
    schedule.schedule_name = util.getUrl(attachment.config_vars)

    yield heroku.post(`/client/v11/databases/${db.id}/transfer-schedules`, {
      body: schedule,
      host: host(db)
    })
  }))
}

module.exports = {
  topic: 'pg',
  command: 'backups:schedule',
  description: 'schedule daily backups for given database',
  needsApp: true,
  needsAuth: true,
  args: [
    {name: 'database', optional: true}
  ],
  flags: [
    {name: 'at', required: true, hasValue: true, description: "at a specific (24h) hour in the given timezone. Defaults to UTC. --at '[HOUR]:00 [TIMEZONE]'"}
  ],
  run: cli.command({preauth: true}, co.wrap(run))
}
