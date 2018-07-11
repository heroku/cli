'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function check (val, message) {
  if (!val) throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:destroy --space example-space vpn-connection-name-or-uuid`)
}

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  check(space, 'Space name required')

  let name = context.args.name
  check(name, 'VPN name required')

  let lib = require('../../lib/vpn')(heroku)

  yield cli.confirmApp(space, context.flags.confirm, `Destructive Action
This command will attempt to destroy the specified VPN Connection in space ${cli.color.green(space)}`)
  yield cli.action(`Tearing down VPN Connection in space ${cli.color.cyan(space)}`, lib.deleteVPN(space))
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:destroy',
  description: 'destroys VPN in a private space',
  help: `Example:

    $ heroku spaces:vpn:destroy --confirm --space example-space vpn-connection-name-or-uuid
    Tearing down VPN Connection in space example-space
  `,
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'name', optional: false, hidden: false}
  ],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get peering info from'},
    {name: 'confirm', hasValue: true, description: 'set to space name bypass confirm prompt'}
  ],
  run: cli.command(co.wrap(run))
}
