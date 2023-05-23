'use strict'

const cli = require('heroku-cli-util')
const path = require('path')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function run(context, heroku) {
  const debug = require('debug')('heroku-pg')
  const fetcher = require('../lib/fetcher')(heroku)
  const host = require('../lib/host')
  const app = context.app
  const db = context.args.database
  const notify = require('../lib/notify')(context)

  let waitFor = async function waitFor(db) {
    let interval = Number.parseInt(context.flags['wait-interval'])
    if (!interval || interval < 0) interval = 5

    let status
    let waiting = false
    let name = 'db'
    let retries = 20

    while (true) {
      try {
        status = await heroku.request({
          host: host(db),
          path: `/client/v11/databases/${db.id}/wait_status`,
        })
      } catch (error) {
        debug(error)
        if (!retries || error.statusCode !== 404) throw error
        retries--
        status = {'waiting?': true}
      }

      if (status['error?']) {
        notify({
          sound: true,
          subtitle: 'error',
          message: `${name} ${status.message}`,
          contentImage: path.join(__dirname, '../assets/error.png'),
        })
        cli.error(status.message)
        cli.exit(1)
      }

      if (!status['waiting?']) {
        if (waiting) {
          notify({
            sound: true,
            message: `${name} is ${status.message}`,
            contentImage: path.join(__dirname, '../assets/success.png'),
          })
          cli.action.done(status.message)
        }

        return
      }

      if (!waiting) {
        waiting = true
        name = db.name
        cli.action.start(`Waiting for database ${cli.color.addon(db.name)}`)
      }

      cli.action.status(status.message)

      await wait(interval * 1000)
    }
  }

  let dbs = []
  if (db) {
    dbs = [await fetcher.addon(app, db)]
  } else {
    dbs = await fetcher.all(app)
  }

  for (let db of dbs) await waitFor(db)
}

module.exports = {
  topic: 'pg',
  command: 'wait',
  description: 'blocks until database is available',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  flags: [
    {name: 'wait-interval', description: 'how frequently to poll in seconds (to avoid rate limiting)', hasValue: true},
    {name: 'no-notify', description: 'do not show OS notification'},
  ],
  run: cli.command({preauth: true}, run),
}
