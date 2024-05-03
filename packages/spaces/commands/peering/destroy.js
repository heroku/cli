'use strict'

let cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  let lib = require('../../lib/peering')(heroku)
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:peerings:destroy pcx-12345678 --space my-space')
  let pcxID = context.flags.pcxid || context.args.pcxid
  await cli.confirmApp(pcxID, context.flags.confirm, `Destructive Action
This command will attempt to destroy the peering connection ${cli.color.bold.red(pcxID)}`)
  await lib.destroyPeeringRequest(space, pcxID)
  cli.log(`Tearing down peering connection ${cli.color.cyan.bold(pcxID)}`)
}

module.exports = {
  topic: 'spaces',
  command: 'peerings:destroy',
  description: 'destroys an active peering connection in a private space',
  help: `Example:

    $ heroku spaces:peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
    Tearing down peering connection pcx-4bd27022
  `,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'pcxid', optional: true, hidden: true}],
  flags: [
    {name: 'pcxid', char: 'p', hasValue: true, description: 'PCX ID of a pending peering'},
    {name: 'space', char: 's', hasValue: true, description: 'space to get peering info from'},
    {name: 'confirm', hasValue: true, description: 'set to PCX ID to bypass confirm prompt'},
  ],
  run: cli.command(run),
}
