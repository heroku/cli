'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const infoCmd = require('./info')
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function * run (context, heroku) {
  const space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:vpn:wait my-space')

  const interval = (typeof context.flags.interval !== 'undefined' ? context.flags.interval : 10) * 1000
  const timeout = (typeof context.flags.timeout !== 'undefined' ? context.flags.timeout : 10 * 60) * 1000
  const deadline = new Date(new Date().getTime() + timeout)
  const spinner = new cli.Spinner({text: `Waiting for VPN in space ${cli.color.green(space)} to allocate...`})

  spinner.start()

  let lib = require('../../lib/vpn')(heroku)
  let info = {}
  do {
    try {
      info = yield lib.getVPNInfo(space)
    } catch (e) {
      // if 404 is received while in this loop, the VPN was deleted because provisioning failed
      if (e.statusCode !== 422) { // ignore 422 since that means VPN is not ready
        throw e
      }
    }

    if ((new Date()).getTime() >= deadline) {
      throw new Error('Timeout waiting for VPN to become allocated.')
    }

    if (info.status === 'failed') {
      throw new Error(info.status_message)
    }

    yield wait(interval)
  } while (info.state !== 'available')

  spinner.stop('done\n')
  infoCmd.render(space, info, context.flags)
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:wait',
  description: 'wait for VPN to be created',
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to wait for VPN from'},
    {name: 'json', description: 'output in json format'},
    {name: 'interval', char: 'i', hasValue: true, description: 'seconds to wait between poll intervals'},
    {name: 'timeout', char: 't', hasValue: true, description: 'maximum number of seconds to wait'}
  ],
  run: cli.command(co.wrap(run))
}
