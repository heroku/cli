'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function displayVPNConfigInfo (space, config) {
  cli.styledHeader(`${space} VPNs`)
  config.ipsec_tunnels.forEach((val, i) => { val.tunnel_id = 'Tunnel ' + (i + 1) })
  cli.table(config.ipsec_tunnels, {
    columns: [
      {key: 'tunnel_id', label: 'ID'},
      {key: 'customer_gateway.outside_address.ip_address', label: 'Customer Gateway'},
      {key: 'vpn_gateway.outside_address.ip_address', label: 'VPN Gateway'},
      {key: 'ike.pre_shared_key', label: 'Pre-shared Key'}
    ]
  })
}

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:vpn:config --space my-space')

  let lib = require('../../lib/vpn')(heroku)
  let config = yield lib.getVPNConfig(space)

  if (context.flags.json) {
    cli.styledJSON(config)
  } else {
    displayVPNConfigInfo(space, config)
  }
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:config',
  description: 'display the configuration information for VPN',
  help: `Example:

    $ heroku spaces:vpn:config my-space`,
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get VPN config from'},
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
