'use strict'

const cli = require('@heroku/heroku-cli-util')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

function check(val, message) {
  if (!val) throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:wait --space my-space vpn-connection-name`)
}

async function run(context, heroku) {
  const space = context.flags.space
  check(space, 'Space name required')
  const name = context.flags.name || context.args.name
  check(name, 'VPN connection name required')

  const interval = (typeof context.flags.interval !== 'undefined' ? context.flags.interval : 10) * 1000
  const timeout = (typeof context.flags.timeout !== 'undefined' ? context.flags.timeout : 20 * 60) * 1000
  const deadline = new Date(Date.now() + timeout)

  let lib = require('../../lib/vpn-connections')(heroku)
  let info = await lib.getVPNConnection(space, name)
  if (info.status === 'active') {
    cli.log('VPN has been allocated.')
    return
  }

  const spinner = new cli.Spinner({text: `Waiting for VPN Connection ${cli.color.green(name)} to allocate...`})

  spinner.start()

  do {
    if (Date.now() >= deadline) {
      throw new Error('Timeout waiting for VPN to become allocated.')
    }

    if (info.status === 'failed') {
      throw new Error(info.status_message)
    }

    await wait(interval)
    info = await lib.getVPNConnection(space, name)
  } while (info.status !== 'active')

  spinner.stop('done\n')

  var config = await lib.getVPNConnection(space, name)
  lib.displayVPNConfigInfo(space, name, config)
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:wait',
  description: 'wait for VPN Connection to be created',
  needsApp: false,
  needsAuth: true,
  args: [{name: 'name', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space the vpn connection belongs to'},
    {name: 'name', char: 'n', hasValue: true, description: 'name or id of the vpn connection to wait for'},
    {name: 'json', description: 'output in json format'},
    {name: 'interval', char: 'i', hasValue: true, description: 'seconds to wait between poll intervals'},
    {name: 'timeout', char: 't', hasValue: true, description: 'maximum number of seconds to wait'},
  ],
  run: cli.command(run),
}
