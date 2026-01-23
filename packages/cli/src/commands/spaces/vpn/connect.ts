import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {splitCsv} from '../../../lib/spaces/parsers.js'

const heredoc = tsheredoc.default

export default class Connect extends Command {
  static args = {
    name: Args.string({
      description: 'name or id of the VPN connection to create',
      required: true,
    }),
  }

  static description = heredoc`
    create VPN
    Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to hosts on your private networks and vice versa.
    The connection is established over the public Internet but all traffic is encrypted using IPSec.
  `
  static examples = [heredoc`
    $ heroku spaces:vpn:connect vpn-connection-name --ip 35.161.69.30 --cidrs 172.16.0.0/16,10.0.0.0/24 --space my-space
    Creating VPN Connection in space my-space... done
    ▸    Use spaces:vpn:wait to track allocation.
  `]

  static flags = {
    cidrs: flags.string({char: 'c', description: 'a list of routable CIDRs separated by commas', required: true}),
    ip: flags.string({char: 'i', description: 'public IP of customer gateway', required: true}),
    space: flags.string({char: 's', description: 'space name', required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Connect)
    const {cidrs, ip, space} = flags
    const {name} = args
    const parsed_cidrs = splitCsv(cidrs)

    ux.action.start(`Creating VPN Connection in space ${color.space(space)}`)
    await this.heroku.post(`/spaces/${space}/vpn-connections`, {
      body: {
        name,
        public_ip: ip,
        routable_cidrs: parsed_cidrs,
      },
    })
    ux.action.stop()

    ux.warn(`Use ${color.code('heroku spaces:vpn:wait')} to track allocation.`)
  }
}
