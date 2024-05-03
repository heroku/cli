'use strict'

let cli = require('@heroku/heroku-cli-util')

function displayJSON(peerings) {
  cli.log(JSON.stringify(peerings, null, 2))
}

async function run(context, heroku) {
  let lib = require('../../lib/peering')(heroku)
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:peerings --space my-space')
  let peers = await lib.getPeerings(space)
  if (context.flags.json) displayJSON(peers)
  else lib.displayPeers(space, peers)
}

module.exports = {
  topic: 'spaces',
  command: 'peerings',
  description: 'list peering connections for a space',
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get peer list from'},
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}
