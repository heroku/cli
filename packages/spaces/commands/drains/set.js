'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let lib = require('../../lib/log-drains')(heroku)
  let space = context.flags.space
  let drain = await lib.putLogDrain(space, context.args.url)
  cli.log(`Successfully set drain ${cli.color.cyan(drain.url)} for ${cli.color.cyan.bold(space)}.`)
  cli.warn('It may take a few moments for the changes to take effect.')
}

const cmd = {
  description: 'replaces the log drain for a space',
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'url'},
  ],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space for which to set log drain', required: true},
  ],
  run: cli.command(run),
}

module.exports = [
  Object.assign({topic: 'spaces', command: 'drains:set', hidden: false}, cmd),
  Object.assign({topic: 'drains', command: 'set', hidden: true}, cmd),
]
