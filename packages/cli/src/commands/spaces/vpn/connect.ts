import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {splitCsv} from '../../../lib/spaces/parsers'

export default class Connect extends Command {
  static topic = 'spaces'
  static description = heredoc`
    create VPN
    Private Spaces can be connected to another private network via an IPSec VPN connection allowing dynos to connect to hosts on your private networks and vice versa.
    The connection is established over the public Internet but all traffic is encrypted using IPSec.
  `
  static examples = [heredoc`
    $ heroku spaces:vpn:connect --name office --ip 35.161.69.30 --cidrs 172.16.0.0/16,10.0.0.0/24 --space my-space
    Creating VPN Connection in space my-space... done
    ▸    Use spaces:vpn:wait to track allocation.
  `]

  static flags = {
    ip: flags.string({char: 'i', description: 'public IP of customer gateway', required: true}),
    cidrs: flags.string({char: 'c', description: 'a list of routable CIDRs separated by commas', required: true}),
    space: flags.string({char: 's', description: 'space name', required: true}),
  }

  static args = {
    name: Args.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Connect)
    const {space, cidrs, ip} = flags
    const {name} = args
    const parsed_cidrs = splitCsv(cidrs)

    ux.action.start(`Creating VPN Connection in space ${color.green(space)}`)
    await this.heroku.post(`/spaces/${space}/vpn-connections`, {
      body: {
        name,
        public_ip: ip,
        routable_cidrs: parsed_cidrs,
      },
    })
    ux.action.stop()

    ux.warn(`Use ${color.cmd('heroku spaces:vpn:wait')} to track allocation.`)
  }
}
