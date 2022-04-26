'use strict'

const cli = require('heroku-cli-util')
const parsers = require('../../lib/parsers')()

function check (val, message) {
  if (!val) throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:update --name office --cidrs 172.16.0.0/16,10.0.0.0/24 --space example-space`)
}

async function run (context, heroku) {
  const lib = require('../../lib/vpn-connections')(heroku)

  const space = context.flags.space
  check(space, 'Space name required')

  const name = context.flags.name || context.args.name
  check(name, 'VPN name required')

  let cidrs = context.flags.cidrs
  check(cidrs, 'CIDRs required')
  cidrs = parsers.splitCsv(cidrs)

  await cli.action(`Updating VPN Connection in space ${cli.color.green(space)}`, lib.patchVPNConnections(space, name, cidrs))
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:update',
  description: 'update VPN',
  example: `$ heroku spaces:vpn:update --name office --cidrs 172.16.0.0/16,10.0.0.0/24 --space my-space
    Updating VPN Connection in space my-space... done
  `,
  help: `Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to hosts on your private networks and vice versa.
The connection is established over the public Internet but all traffic is encrypted using IPSec.`,
  needsApp: false,
  needsAuth: true,
  args: [
    { name: 'name', optional: true, hidden: true }
  ],
  flags: [
    { name: 'name', char: 'n', hasValue: true, description: 'VPN name' },
    { name: 'cidrs', char: 'c', hasValue: true, description: 'a list of routable CIDRs separated by commas' },
    { name: 'space', char: 's', hasValue: true, description: 'space name' }
  ],
  run: cli.command(run)
}
