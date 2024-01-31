'use strict'

let cli = require('heroku-cli-util')

async function run(context, heroku) {
  let lib = require('../../lib/log-drains')(heroku)
  let drain = await lib.getLogDrain(context.flags.space)
  if (context.flags.json) {
    cli.log(JSON.stringify(drain, null, 2))
  } else {
    let output = `${cli.color.cyan(drain.url)} (${cli.color.green(drain.token)})`
    cli.log(output)
  }
}

const cmd = {
  description: 'display the log drain for a space',
  needsApp: false,
  needsAuth: true,
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space for which to get log drain', required: true},
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}

module.exports = [
  Object.assign({topic: 'spaces', command: 'drains:get', hidden: false}, cmd),
  Object.assign({topic: 'drains', command: 'get', hidden: true}, cmd),
]
