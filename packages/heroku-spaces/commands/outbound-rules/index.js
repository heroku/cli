'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
const {SpaceCompletion} = require('cli-engine-heroku/lib/completions')

function displayJSON (rules) {
  cli.log(JSON.stringify(rules, null, 2))
}

function * run (context, heroku) {
  let lib = require('../../lib/outbound-rules')(heroku)
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku outbound-rules --space my-space')
  let rules = yield lib.getOutboundRules(space)
  if (context.flags.json) displayJSON(rules)
  else lib.displayRules(space, rules)
}

module.exports = {
  topic: 'outbound-rules',
  description: 'list Outbound Rules for a space',
  help: `
Outbound Rules are only available on Private Spaces.

Newly created spaces will have an "Allow All" rule set by default
allowing all egress dyno traffic outside of the space.  You can
remove this default rule to completely stop your private dynos from
talking to the world.

You can add specific rules that only allow your dyno to communicate with trusted hosts.
  `,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get outbound rules from', completion: SpaceCompletion},
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
