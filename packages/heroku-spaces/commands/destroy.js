'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const lib = require('../lib/spaces')

function * run (context, heroku) {
  let spaceName = context.flags.space || context.args.space
  if (!spaceName) throw new Error('Space name required.\nUSAGE: heroku spaces:destroy my-space')
  let natWarning = ''

  let space = yield heroku.get(`/spaces/${spaceName}`)
  if (space.state === 'allocated') {
    space.outbound_ips = yield heroku.get(`/spaces/${spaceName}/nat`)
    if (space.outbound_ips && space.outbound_ips.state === 'enabled') {
      natWarning = `
The Outbound IPs for this space will be reused!
Ensure that external services no longer trust (whitelist) these Outbound IPs: ${lib.displayNat(space.outbound_ips)}`
    }
  }

  yield cli.confirmApp(spaceName, context.flags.confirm, `Destructive Action
This command will destroy the space ${cli.color.bold.red(spaceName)}
${natWarning}
`)
  let request = heroku.delete(`/spaces/${spaceName}`)
  yield cli.action(`Destroying space ${cli.color.cyan(spaceName)}`, request)
}

module.exports = {
  topic: 'spaces',
  command: 'destroy',
  description: 'destroy a space',
  help: `Example:

    $ heroku spaces:destroy --space my-space
    Destroying my-space... done
`,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to destroy'},
    {name: 'confirm', hasValue: true, description: 'set to space name to bypass confirm prompt'}
  ],
  run: cli.command(co.wrap(run))
}
