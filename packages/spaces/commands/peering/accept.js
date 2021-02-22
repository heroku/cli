'use strict'

let cli = require('heroku-cli-util')

async function run (context, heroku) {
  let lib = require('../../lib/peering')(heroku)
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:peerings:accept pcx-12345678 --space my-space')
  let pcxID = context.flags.pcxid || context.args.pcxid
  await lib.acceptPeeringRequest(space, pcxID)
  cli.log(`Accepting and configuring peering connection ${cli.color.cyan.bold(pcxID)}`)
}

module.exports = {
  topic: 'spaces',
  command: 'peerings:accept',
  description: 'accepts a pending peering request for a private space',
  help: `Example:

    $ heroku spaces:peerings:accept pcx-4bd27022 --space example-space
    Accepting and configuring peering connection pcx-4bd27022
  `,
  needsApp: false,
  needsAuth: true,
  args: [{ name: 'pcxid', optional: true, hidden: true }],
  flags: [
    { name: 'pcxid', char: 'p', hasValue: true, description: 'PCX ID of a pending peering' },
    { name: 'space', char: 's', hasValue: true, description: 'space to get peering info from' }
  ],
  run: cli.command(run)
}
