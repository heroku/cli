'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const format = require('../../lib/format')()

function displayVPNConnections (space, connections) {
  cli.styledHeader(`${space} VPN Connections`)
  cli.table(connections, {
    columns: [
      {key: 'name', label: 'Name'},
      {key: 'status', label: 'Status', format: format.VPNStatus}
    ]
  })
}
function render (space, connections, flags) {
  if (flags.json) {
    cli.styledJSON(connections)
  } else {
    displayVPNConnections(space, connections)
  }
}

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:vpn:connections --space my-space')

  let lib = require('../../lib/vpn-connections')(heroku)
  let connections = yield lib.getVPNConnections(space)
  render(space, connections, context.flags)
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:info',
  description: 'list the VPN Connections for a space',
  help: `$TODO
  `,
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get VPN connections from'},
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run)),
  render: render
}
