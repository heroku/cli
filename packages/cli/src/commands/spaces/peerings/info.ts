import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import {displayPeeringInfo} from '../../../lib/spaces/peering'

export default class Info extends Command {
  static topic = 'spaces'
  static hiddenAliases = ['spaces:peering:info']
  static description = heredoc(`
    display the information necessary to initiate a peering connection

    You will use the information provided by this command to establish a peering connection request from your AWS VPC to your private space.

    To start the peering process, go into your AWS console for the VPC you would like peered with your Private Space,
    navigate to the VPC service, choose the "Peering Connections" option and click the "Create peering connection" button.

    - The AWS Account ID and VPC ID are necessary for the AWS VPC Peering connection wizard.
    - You will also need to configure your VPC route table to route the Dyno CIDRs through the peering connection.

    Once you've established the peering connection request, you can use the spaces:peerings:accept command to accept and
    configure the peering connection for the space.
  `)

  static flags = {
    space: flags.string({char: 's', description: 'space to get peering info from'}),
    json: flags.boolean({description: 'output in json format'}),
  }

  static examples = [heredoc(`
    $ heroku spaces:peering:info example-space
    === example-space  Peering Info

    AWS Account ID:    012345678910
    AWS Region:        us-west-2
    AWS VPC ID:        vpc-baadf00d
    AWS VPC CIDR:      10.0.0.0/16
    Space CIDRs:       10.0.128.0/20, 10.0.144.0/20
    Unavailable CIDRs: 10.1.0.0/16
  `)]

  static args = {
    space: Args.string({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Info)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const {body: pInfo} = await this.heroku.get<Heroku.PeeringInfo>(`/spaces/${spaceName}/peering-info`)
    if (flags.json)
      ux.log(JSON.stringify(pInfo, null, 2))
    else
      displayPeeringInfo(spaceName as string, pInfo)
  }
}
