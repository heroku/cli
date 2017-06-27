'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let lib = require('../../lib/outbound-rules')(heroku)
  let space = context.flags.space
  if (!space) throw new Error('Space name required.')
  let rules = yield lib.getOutboundRules(space)
  rules.rules = rules.rules || []

  if (rules.rules.length === 0) throw new Error('No Outbound Rules configured. Nothing to do.')

  let deleted = rules.rules.splice(context.args.ruleNumber - 1, 1)[0]

  yield cli.confirmApp(space, context.flags.confirm, `Destructive Action
This will remove:
Destination: ${deleted.target}, From Port: ${deleted.from_port}, To Port: ${deleted.to_port}, Protocol ${deleted.protocol}
from the Outbound Rules on ${cli.color.cyan.bold(space)}
`)
  rules = yield lib.putOutboundRules(space, rules)
  cli.log(`Removed Rule ${cli.color.cyan.bold(context.args.rulenumber)} from Outbound Rules on ${cli.color.cyan.bold(space)}`)
  cli.warn('It may take a few moments for the changes to take effect.')
}

module.exports = {
  topic: 'outbound-rules',
  command: 'remove',
  description: 'Remove a Rules from the list of Outbound Rules',
  help: `Example:

    $ heroku outbound-rules:remove --space my-space 4
    Removed 192.168.2.0/24 from trusted IP ranges on my-space
  `,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'ruleNumber'}
  ],
  flags: [
    {name: 'space', hasValue: true, optional: false, description: 'space to remove rule from'},
    {name: 'confirm', hasValue: true, description: 'set to space name to bypass confirm prompt'}
  ],
  run: cli.command(co.wrap(run))
}
