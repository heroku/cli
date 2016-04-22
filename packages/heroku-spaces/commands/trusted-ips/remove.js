'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let lib = require('../../lib/trusted-ips')(heroku)
  let space = context.flags.space
  let rules = yield lib.getRules(space)
  rules.rules = rules.rules || []
  if (rules.rules.length === 0) throw new Error('No IP ranges are configured. Nothing to do.')
  let originalLength = rules.rules.length
  rules.rules = rules.rules.filter((r) => r.source !== context.args.source)
  if (rules.rules.length === originalLength) throw new Error(`No IP range matching ${context.args.source} was found.`)
  rules = yield lib.putRules(space, rules)
  cli.log(`Removed ${cli.color.cyan.bold(context.args.source)} from trusted IP ranges on ${cli.color.cyan.bold(space)}`)
  cli.warn('It may take a few moments for the changes to take effect.')
}

module.exports = {
  topic: 'trusted-ips',
  command: 'remove',
  description: 'Remove a range from the list of trusted IP ranges',
  help: `
Uses CIDR notation.

Example:
  $ heroku trusted-ips:remove --space my-space 192.168.2.0/24
  Removed 192.168.2.0/24 from trusted IP ranges on my-space
  `,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'source'}
  ],
  flags: [
    {name: 'space', hasValue: true, optional: false, description: 'space to remove rule from'},
    {name: 'confirm', hasValue: true, description: 'set to space name to bypass confirm prompt'}
  ],
  run: cli.command(co.wrap(run))
}
