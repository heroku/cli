'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function render (space, connections, flags) {
  if (flags.json) {
    cli.styledJSON(connections)
  } else {

  }
}

function * run (context, heroku) {

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

  ],
  run: cli.command(co.wrap(run)),
  render: render
}
