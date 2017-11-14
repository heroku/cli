'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:vpn:config --space my-space')

  let lib = require('../../lib/vpn')(heroku)
  let config = yield lib.getVPNConfig(space)

  // FIXME: output everything in JSON for now since there are too many fields
  cli.styledJSON(config)
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
    {name: 'space', char: 's', hasValue: true, description: 'space to get VPN config from'}
  ],
  run: cli.command(co.wrap(run))
}
