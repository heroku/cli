import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {splitCsv} from '../../../lib/spaces/parsers.js'

const heredoc = tsheredoc.default

export default class Update extends Command {
  static args = {
    name: Args.string({
      description: 'name or id of the VPN connection to update',
      required: true,
    }),
  }

  static description = heredoc`
    update VPN
    Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to hosts on your private networks and vice versa.
    The connection is established over the public Internet but all traffic is encrypted using IPSec.
  `
  static example = heredoc`
    ${color.command('heroku spaces:vpn:update vpn-connection-name --space my-space --cidrs 172.16.0.0/16,10.0.0.0/24')}
    Updating VPN Connection in space my-space... done`

  static flags = {
    cidrs: flags.string({char: 'c', description: 'a list of routable CIDRs separated by commas', required: true}),
    space: flags.string({char: 's', description: 'space name', required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Update)
    const {cidrs, space} = flags
    const {name} = args
    const parsedCidrs = splitCsv(cidrs)

    ux.action.start(`Updating VPN Connection in space ${color.space(space)}`)
    await this.heroku.patch(
      `/spaces/${space}/vpn-connections/${name}`,
      {body: {routable_cidrs: parsedCidrs}},
    )
    ux.action.stop()
  }
}
