'use strict'

const cli = require('@heroku/heroku-cli-util')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function run(context, heroku) {
  const api = require('../lib/shared')(context, heroku)
  const addon = await api.getRedisAddon()

  let waitFor = async function waitFor() {
    let interval = Number.parseInt(context.flags['wait-interval'])
    if (!interval || interval < 0) interval = 5
    let status
    let waiting = false

    while (true) {
      try {
        status = await api.request(`/redis/v0/databases/${addon.name}/wait`, 'GET')
      } catch (error) {
        if (error.statusCode !== 404) throw error
        status = {'waiting?': true}
      }

      if (!status['waiting?']) {
        if (waiting) {
          cli.action.done(status.message)
        }

        return
      }

      if (!waiting) {
        waiting = true
        cli.action.start(`Waiting for database ${cli.color.addon(addon.name)}`)
      }

      cli.action.status(status.message)

      await wait(interval * 1000)
    }
  }

  await waitFor()
}

module.exports = {
  topic: 'redis',
  command: 'wait',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'database', optional: true}],
  description: 'wait for Redis instance to be available',
  flags: [
    {name: 'wait-interval', description: 'how frequently to poll in seconds', hasValue: true},
  ],
  run: cli.command({preauth: true}, run),
}
