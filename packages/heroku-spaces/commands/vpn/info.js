'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const format = require('../../lib/format')()

function displayVPNInfo (space, info) {
  let sF = function (s) {
    let colored = s
    switch (s) {
      case 'UP':
      case 'available':
        colored = `${cli.color.green(colored)}`
        break
      case 'pending':
        colored = `${cli.color.yellow(colored)}`
        break
      case 'DOWN':
      case 'deleting':
      case 'deleted':
        colored = `${cli.color.red(colored)}`
        break
    }

    return colored
  }

  cli.styledHeader(`${space} VPN Info`)
  cli.styledObject({
    ID: info.id,
    'Public IP': info.public_ip,
    'Routable CIDRs': format.CIDR(info.routable_cidrs),
    State: `${sF(info.state)}`
  }, ['ID', 'Public IP', 'Routable CIDRs', 'State'])

  // make up tunnel IDs
  info.tunnels.forEach((val, i) => { val.tunnel_id = 'Tunnel ' + (i + 1) })
  cli.styledHeader(`${space} Tunnel Info`)
  cli.table(info.tunnels, {
    columns: [
      {key: 'tunnel_id', label: 'VPN Tunnel'},
      {key: 'outside_ip_address', label: 'IP Address'},
      {key: 'status', label: 'Status', format: status => sF(status)},
      {key: 'last_status_change', label: 'Status Last Changed'},
      {key: 'status_message', label: 'Details'}
    ]
  })
}

function render (space, info, flags) {
  if (flags.json) {
    cli.styledJSON(info)
  } else {
    displayVPNInfo(space, info)
  }
}

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:vpn:info --space my-space')

  let lib = require('../../lib/vpn')(heroku)
  let info = yield lib.getVPNInfo(space)
  render(space, info, context.flags)
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:info',
  description: 'display the information for VPN',
  help: `Example:

    $ heroku spaces:vpn:info my-space
    === my-space VPN Info
    ID:             123456789012
    Public IP:      35.161.69.30
    Routable CIDRs: 172.16.0.0/16
    State:          available
    === my-space Tunnel Info
    VPN Tunnel  IP Address     Status  Status Last Changed   Details
    ──────────  ─────────────  ──────  ────────────────────  ──────────────
    Tunnel 1    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
    Tunnel 2    52.44.146.197  UP      2016-10-25T22:09:05Z  status message`,
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get VPN info from'},
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run)),
  render: render
}
