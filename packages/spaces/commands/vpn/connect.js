'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const parsers = require('../../lib/parsers')()

function check (val, message) {
  if (!val) throw new Error(`${message}.\nUSAGE: heroku spaces:vpn:connect --name office --ip 35.161.69.30 --cidrs 172.16.0.0/16,10.0.0.0/24 --space example-space`)
}

function * run (context, heroku) {
  let lib = require('../../lib/vpn-connections')(heroku)

  let space = context.flags.space || context.args.space
  check(space, 'Space name required')

  let name = context.flags.name
  check(name, 'VPN name required')

  let ip = context.flags.ip
  check(ip, 'IP required')

  let cidrs = context.flags.cidrs
  check(cidrs, 'CIDRs required')
  cidrs = parsers.splitCsv(cidrs)

  yield cli.action(`Creating VPN Connection in space ${cli.color.green(space)}`, lib.postVPNConnections(space, name, ip, cidrs))
  cli.warn('Use spaces:vpn:wait to track allocation.')
}

module.exports = {
  topic: 'spaces',
  command: 'vpn:connect',
  description: 'create VPN',
  help: `Example:

    $ heroku spaces:vpn:connect --name office --ip 35.161.69.30 --cidrs 172.16.0.0/16,10.0.0.0/24 --space my-space
    Creating VPN Connection in space my-space... done
    ▸    Use spaces:vpn:wait to track allocation.
  `,
  hidden: true,
  needsApp: false,
  needsAuth: true,
  args: [
    {name: 'space', optional: true, hidden: true}
  ],
  flags: [
    {name: 'name', char: 'n', hasValue: true, description: 'VPN name'},
    {name: 'ip', char: 'i', hasValue: true, description: 'public IP of customer gateway'},
    {name: 'cidrs', char: 'c', hasValue: true, description: 'a list of routable CIDRs separated by commas'},
    {name: 'space', char: 's', hasValue: true, description: 'space name'}
  ],
  run: cli.command(co.wrap(run))
}
