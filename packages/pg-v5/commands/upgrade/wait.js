'use strict'

const cli = require('heroku-cli-util')
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function run(context, heroku) {
  const debug = require('debug')('heroku-pg')
  const fetcher = require('../../lib/fetcher')(heroku)
  const host = require('../../lib/host')
  const strftime = require('strftime')
  const app = context.app
  const db = context.args.database

  let waitFor = async function waitFor(db) {
    let interval = parseInt(context.flags['wait-interval'])
    if (!interval || interval < 0) interval = 5

    let status
    let upgrading = false
    let retries = 20
    let seenStates = []

    while (true) {
      try {
        status = await heroku.request({
          host: host(db),
          path: `/client/v11/databases/${db.id}/upgrade/status`,
        })
      } catch (err) {
        debug(err)
        if (!retries || err.statusCode !== 404) throw err
        retries--
        status = { 'upgrading?': false }
      }

      let mostRecentState = status.states.pop()
      let stateName = mostRecentState.state
      let enteredAt = new Date(mostRecentState.entered_at)
      let message = `${strftime('%Y-%m-%dT%H:%M:%S%z', enteredAt)} => ${stateName}`

      if (!status['upgrading?']) {
        if (upgrading) {
          cli.action.done(status.message)
        }
        return
      }

      if (!upgrading) {
        upgrading = true
        cli.action.start(`Upgrading database ${cli.color.addon(db.name)}`)
      }

      cli.action.status(`${status.message}, ${message}`)

      await wait(interval * 1000)
    }
  }

  let fetchedDb = await fetcher.addon(app, db)
  waitFor(fetchedDb)
}

module.exports = {
  topic: 'pg:upgrade',
  command: 'wait',
  description: 'blocks until database has been upgraded',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'database' }],
  flags: [
    { name: 'wait-interval', description: 'how frequently to poll in seconds', hasValue: true }
  ],
  run: cli.command({ preauth: true }, run),
}
