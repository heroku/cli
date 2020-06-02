'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function displayJSON (hosts) {
  cli.log(JSON.stringify(hosts, null, 2))
}

function * run (context, heroku) {
  let lib = require('../../lib/hosts')(heroku)
  let space = context.flags.space || context.args.space
  if (!space) throw new Error('Space name required.\nUSAGE: heroku spaces:hosts --space my-space')
  let hosts = yield lib.getHosts(space)
  if (context.flags.json) displayJSON(hosts)
  else lib.displayHosts(space, hosts)
}

module.exports = {
  topic: 'spaces',
  command: 'hosts',
  hidden: true,
  description: 'list dedicated hosts for a space',
  needsApp: false,
  needsAuth: true,
  args: [{ name: 'space', optional: true, hidden: true }],
  flags: [
    { name: 'space', char: 's', hasValue: true, description: 'space to get host list from' },
    { name: 'json', description: 'output in json format' }
  ],
  run: cli.command(co.wrap(run))
}
