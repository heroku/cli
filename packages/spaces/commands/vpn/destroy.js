'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function check (val, message) {
  if (!val) throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:destroy --space example-space vpn-connection-name`)
}

function * run (context, heroku) {
  let space = context.flags.space
  check(space, 'Space name required')

  let name = context.flags.name || context.args.name
  check(name, 'VPN name required')

  let lib = require('../../lib/vpn-connections')(heroku)

  yield cli.confirmApp(name, context.flags.confirm, `Destructive Action
This command will attempt to destroy the specified VPN Connection in space ${cli.color.green(space)}`)
  yield cli.action(`Tearing down VPN Connection ${cli.color.cyan(name)} in space ${cli.color.cyan(space)}`, lib.deleteVPNConnection(space, name))
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:destroy',
  description: 'destroys VPN in a private space',
  help: `Example:

    $ heroku spaces:vpn:destroy --space example-space vpn-connection-name --confirm vpn-connection-name
    Tearing down VPN Connection vpn-connection-name in space example-space
  `,
  needsApp: false,
  needsAuth: true,
  args: [
    { name: 'name', optional: true, hidden: true }
  ],
  flags: [
    { name: 'space', char: 's', hasValue: true, description: 'space to get peering info from' },
    { name: 'name', char: 'n', hasValue: true, description: 'name or id of the VPN connection to retrieve config from' },
    { name: 'confirm', hasValue: true, description: 'set to VPN connection name to bypass confirm prompt' }
  ],
  run: cli.command(co.wrap(run))
}
