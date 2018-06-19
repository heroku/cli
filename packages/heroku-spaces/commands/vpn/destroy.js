'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:vpn:destroy --space my-space')

  let lib = require('../../lib/vpn')(heroku)

  yield cli.confirmApp(space, context.flags.confirm, `Destructive Action
This command will attempt to destroy VPN in space ${cli.color.green(space)}`)
  yield cli.action(`Tearing down VPN in space ${cli.color.cyan(space)}`, lib.deleteVPN(space))
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:destroy',
  description: 'destroys VPN in a private space',
  help: `Example:

    $ heroku spaces:vpn:destroy --confirm --space my-space
    Tearing down VPN in space my-space
  `,
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get peering info from'},
    {name: 'confirm', hasValue: true, description: 'set to space name bypass confirm prompt'}
  ],
  run: cli.command(co.wrap(run))
}
