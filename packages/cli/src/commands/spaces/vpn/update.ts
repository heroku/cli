import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {splitCsv} from '../../../lib/spaces/parsers'
import heredoc from 'tsheredoc'

export default class Update extends Command {
  static topic = 'spaces'
  static description = heredoc`
    update VPN
    Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to hosts on your private networks and vice versa.
    The connection is established over the public Internet but all traffic is encrypted using IPSec.
  `
  static flags = {
    cidrs: flags.string({char: 'c', description: 'a list of routable CIDRs separated by commas', required: true}),
    space: flags.string({char: 's', description: 'space name', required: true}),
  }

  static example = heredoc`
    $ heroku spaces:vpn:update vpn-connection-name --space my-space --cidrs 172.16.0.0/16,10.0.0.0/24
    Updating VPN Connection in space my-space... done
  `
  static args = {
    name: Args.string({
      required: true,
      description: 'name or id of the VPN connection to retrieve config from',
    }),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Update)
    const {space, cidrs} = flags
    const {name} = args
    const parsedCidrs = splitCsv(cidrs)

    ux.action.start(`Updating VPN Connection in space ${color.green(space)}`)
    await this.heroku.patch(
      `/spaces/${space}/vpn-connections/${name}`,
      {body: {routable_cidrs: parsedCidrs}},
    )
    ux.action.stop()
  }
}
