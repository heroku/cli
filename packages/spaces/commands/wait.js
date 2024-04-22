// -*- mode: js; js-indent-level: 2; -*-
'use strict'
let cli = require('heroku-cli-util')
const lib = require('../lib/spaces')
let wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function run(context, heroku) {
  const spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:wait my-space')

  const interval = (typeof context.flags.interval !== 'undefined' ? context.flags.interval : 30) * 1000
  const timeout = (typeof context.flags.timeout !== 'undefined' ? context.flags.timeout : 25 * 60) * 1000
  const deadline = new Date(Date.now() + timeout)
  const spinner = new cli.Spinner({text: `Waiting for space ${cli.color.green(spaceName)} to allocate...`})

  spinner.start()

  let headers = {}
  if (!context.flags.json) {
    headers = {'Accept-Expansion': 'region'}
  }

  let space = await heroku.get(`/spaces/${spaceName}`, {headers})
  while (space.state === 'allocating') {
    if (Date.now() >= deadline) {
      throw new Error('Timeout waiting for space to become allocated.')
    }

    await wait(interval)
    space = await heroku.get(`/spaces/${spaceName}`, {headers})
  }

  try {
    space.outbound_ips = await heroku.get(`/spaces/${spaceName}/nat`)
  } catch (error) {
    const debug = require('debug')('spaces:wait') // eslint-disable-line node/no-extraneous-require
    debug(`Retrieving NAT details for the space failed with ${error}`)
  }

  spinner.stop('done\n')

  lib.renderInfo(space, context.flags)
  _notify(context.flags.space || context.args.space)
}

function _notify(spaceName) {
  try {
    const {notify} = require('@heroku-cli/notifications')
    notify({
      title: `${spaceName}`,
      subtitle: `heroku spaces:wait ${spaceName}`,
      message: 'space was successfully created',
      sound: true,
    })
  } catch (error) {
    cli.warn(error)
  }
}

module.exports = {
  topic: 'spaces',
  command: 'wait',
  description: 'wait for a space to be created',
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get info of'},
    {name: 'json', description: 'output in json format'},
    {name: 'interval', char: 'i', hasValue: true, description: 'seconds to wait between poll intervals'},
    {name: 'timeout', char: 't', hasValue: true, description: 'maximum number of seconds to wait'},
  ],
  run: cli.command(run),
}
