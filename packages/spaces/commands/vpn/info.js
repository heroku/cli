'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const format = require('../../lib/format')()

function displayVPNInfo (space, name, info) {
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

  cli.styledHeader(`${name} VPN Info`)
  cli.styledObject({
    ID: info.id,
    'Public IP': info.public_ip,
    'Routable CIDRs': format.CIDR(info.routable_cidrs),
    'Status': info.status,
    'Status Message': info.status_message
  }, ['ID', 'Public IP', 'Routable CIDRs', 'State', 'Status', 'Status Message'])

  // make up tunnel IDs
  info.tunnels.forEach((val, i) => { val.tunnel_id = 'Tunnel ' + (i + 1) })
  cli.styledHeader(`${name} VPN Tunnel Info`)
  cli.table(info.tunnels, {
    columns: [
      {key: 'tunnel_id', label: 'VPN Tunnel'},
      {key: 'ip', label: 'IP Address'},
      {key: 'status', label: 'Status', format: status => sF(status)},
      {key: 'last_status_change', label: 'Status Last Changed'},
      {key: 'status_message', label: 'Details'}
    ]
  })
}

function render (space, name, info, flags) {
  if (flags.json) {
    cli.styledJSON(info)
  } else {
    displayVPNInfo(space, name, info)
  }
}

function check (val, message) {
  if (!val) throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:info --space example-space --name vpn-connection-name`)
}

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  check(space, 'Space name required')

  let name = context.flags.name || context.args.name
  check(name, 'VPN connection name required')

  let lib = require('../../lib/vpn-connections')(heroku)
  let info = yield lib.getVPNConnection(space, name)
  render(space, name, info, context.flags)
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:info',
  description: 'display the information for VPN',
  help: `Example:

    $ heroku spaces:vpn:info my-space --name vpn-connection-name
    === vpn-connection-name VPN Tunnel Info
    Name:           vpn-connection-name
    ID:             123456789012
    Public IP:      35.161.69.30
    Routable CIDRs: 172.16.0.0/16
    Status:         failed
    Status Message: supplied CIDR block already in use
    === my-space Tunnel Info
    VPN Tunnel  IP Address     Status  Status Last Changed   Details
    ──────────  ─────────────  ──────  ────────────────────  ──────────────
    Tunnel 1    52.44.146.197  UP      2016-10-25T22:09:05Z  status message
    Tunnel 2    52.44.146.197  UP      2016-10-25T22:09:05Z  status message`,
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: false, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space the vpn connection belongs to'},
    {name: 'json', description: 'output in json format'},
    {name: 'name', char: 'n', hasValue: true, description: 'name or id of the VPN connection to get info from'}
  ],
  run: cli.command(co.wrap(run)),
  render: render
}
