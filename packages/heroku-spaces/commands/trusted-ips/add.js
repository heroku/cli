'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let lib = require('../../lib/trusted-ips')(heroku)
  let space = context.flags.space
  let ruleset = yield lib.getRules(space)
  ruleset.rules = ruleset.rules || []
  if (ruleset.rules.find((rs) => rs.source === context.args.source)) throw new Error(`A rule already exists for ${context.args.source}.`)
  ruleset.rules.push({action: 'allow', source: context.args.source})
  ruleset = yield lib.putRules(space, ruleset)
  cli.log(`Added ${cli.color.cyan.bold(context.args.source)} to trusted IP ranges on ${cli.color.cyan.bold(space)}`)
  cli.warn('It may take a few moments for the changes to take effect.')
}

module.exports = {
  topic: 'trusted-ips',
  command: 'add',
  description: 'Add one range to the list of trusted IP ranges',
  help: `
Uses CIDR notation.

Example:
  $ heroku trusted-ips:add --space my-space 192.168.2.0/24
  Added 192.168.0.1/24 to trusted IP ranges on my-space
  `,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'source'}
  ],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to add rule to'},
    {name: 'confirm', hasValue: true, description: 'set to space name to bypass confirm prompt'}
  ],
  run: cli.command(co.wrap(run))
}
