'use strict'

const cli = require('@heroku/heroku-cli-util')

function displayVPNConfigInfo(space, name, config) {
  cli.styledHeader(`${name} VPN Tunnels`)
  config.tunnels.forEach((val, i) => {
    val.tunnel_id = 'Tunnel ' + (i + 1)
    val.routable_cidr = config.space_cidr_block
    val.ike_version = config.ike_version
  })

  cli.table(config.tunnels, {
    columns: [
      {key: 'tunnel_id', label: 'VPN Tunnel'},
      {key: 'customer_ip', label: 'Customer Gateway'},
      {key: 'ip', label: 'VPN Gateway'},
      {key: 'pre_shared_key', label: 'Pre-shared Key'},
      {key: 'routable_cidr', label: 'Routable Subnets'},
      {key: 'ike_version', label: 'IKE Version'},
    ],
  })
}

function check(val, message) {
  if (!val) throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:config --space my-space vpn-connection-name`)
}

async function run(context, heroku) {
  let space = context.flags.space || context.args.space
  check(space, 'Space name required')

  let name = context.flags.name || context.args.name
  check(name, 'VPN connection name required')

  let lib = require('../../lib/vpn-connections')(heroku)
  let config = await lib.getVPNConnection(space, name)

  if (context.flags.json) {
    cli.styledJSON(config)
  } else {
    displayVPNConfigInfo(space, name, config)
  }
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:config',
  description: 'display the configuration information for VPN',
  help: `Example:

    $ heroku spaces:vpn:config --space my-space vpn-connection-name
    === vpn-connection-name VPN Tunnels
    VPN Tunnel  Customer Gateway  VPN Gateway     Pre-shared Key  Routable Subnets  IKE Version
    ──────────  ────────────────  ──────────────  ──────────────  ────────────────  ───────────
    Tunnel 1    104.196.121.200   35.171.237.136  abcdef12345     10.0.0.0/16       1
    Tunnel 2    104.196.121.200   52.44.7.216     fedcba54321     10.0.0.0/16       1

You will use the information provided by this command to establish a Private Space VPN Connection.

- You must configure your VPN Gateway to use both Tunnels provided by Heroku
- The VPN Gateway values are the IP addresses of the Private Space Tunnels
- The Customer Gateway value is the Public IP of your VPN Gateway
- The VPN Gateway must use the IKE Version shown and the Pre-shared Keys as the authentication method
`,
  hidden: false,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'name', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space the VPN connection belongs to'},
    {name: 'name', char: 'n', hasValue: true, description: 'name or id of the VPN connection to retrieve config from'},
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
  displayVPNConfigInfo: displayVPNConfigInfo,
}
