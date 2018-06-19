'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
const {SpaceCompletion} = require('@heroku-cli/command/lib/completions')

const ProtocolCompletion = {
  cacheDuration: 60 * 60 * 24 * 365, // cache yearly
  options: async (ctx) => {
    return ['tcp', 'udp', 'icmp', '0-255', 'any']
  }
}

function * run (context, heroku) {
  let lib = require('../../lib/outbound-rules')(heroku)
  let space = context.flags.space
  if (!space) throw new Error('Space name required.')
  let ruleset = yield lib.getOutboundRules(space)
  ruleset.rules = ruleset.rules || []
  let ports = yield lib.parsePorts(context.flags.protocol, context.flags.port)
  ruleset.rules.push({
    target: context.flags.dest,
    from_port: ports[0],
    to_port: ports[1] || ports[0],
    protocol: context.flags.protocol})
  ruleset = yield lib.putOutboundRules(space, ruleset)
  cli.log(`Added rule to the Outbound Rules of ${cli.color.cyan.bold(space)}`)
  cli.warn('Modifying the Outbound Rules may break Add-ons for Apps in this Private Space')
}

module.exports = {
  topic: 'outbound-rules',
  command: 'add',
  description: 'Add outbound rules to a Private Space',
  help: `
The destination flag uses CIDR notation.

 Example:

    $ heroku outbound-rules:add --space my-space --dest 192.168.2.0/24 --protocol tcp --port 80
    Added 192.168.0.1/24 to the outbound rules on my-space

 Example with port range:

    $ heroku outbound-rules:add --space my-space --dest 192.168.2.0/24 --protocol tcp --port 80-100
    Added 192.168.0.1/24 to the outbound rules on my-space

 Example opening up everything

    $ heroku outbound-rules:add --space my-space --dest 0.0.0.0/0 --protocol any --port any
    Added 0.0.0.0/0 to the outbound rules on my-space

ICMP Rules
The ICMP protocol has types, not ports, but the underlying systems treat them as the same. For this reason,
when you want to allow ICMP traffic you will use the --port flag to specify the ICMP types you want to
allow. ICMP types are numbered, 0-255.
  `,
  needsApp: false,
  needsAuth: true,
  args: [],
  flags: [
    {name: 'space', char: 's', hasValue: true, description: 'space to add rule to', completion: SpaceCompletion},
    {name: 'confirm', hasValue: true, description: 'set to space name to bypass confirm prompt'},
    {name: 'dest', hasValue: true, description: 'target CIDR block dynos are allowed to communicate with'},
    {name: 'protocol', hasValue: true, description: 'the protocol dynos are allowed to use when communicating with hosts in destination CIDR block. Valid protocols are "tcp", "udp", "icmp", "0-255" and "any".', completion: ProtocolCompletion},
    {name: 'port', hasValue: true, description: 'the port dynos are allowed to use when communicating with hosts in destination CIDR block. Accepts a range in `<lowest port>-<highest port>` format. 0 is the minimum. The maximum port allowed is 65535, except for ICMP with a maximum of 255.'}
  ],
  run: cli.command(co.wrap(run))
}
