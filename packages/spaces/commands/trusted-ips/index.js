'use strict'

let cli = require('@heroku/heroku-cli-util')

function displayJSON(rules) {
  cli.log(JSON.stringify(rules, null, 2))
}

async function run(context, heroku) {
  let lib = require('../../lib/trusted-ips')(heroku)
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku trusted-ips my-space')
  let rules = await lib.getRules(space)
  if (context.flags.json) displayJSON(rules)
  else lib.displayRules(space, rules)
}

module.exports = {
  topic: 'trusted-ips',
  description: 'list trusted IP ranges for a space',
  help: `
Trusted IP ranges are only available on Private Spaces.

The space name is a required parameter. Newly created spaces will have 0.0.0.0/0 set by default
allowing all traffic to applications in the space. More than one CIDR block can be provided at
a time to the commands listed below. For example 1.2.3.4/20 and 5.6.7.8/20 can be added with:
  `,
  needsApp: false,
  needsAuth: true,
  args: [{name: 'space', optional: true, hidden: true}],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to get inbound rules from'},
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}
