import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {displayPeerings, displayPeeringsAsJSON} from '../../../lib/spaces/peering.js'

const heredoc = tsheredoc.default

export default class Index extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }
  static description = 'list peering connections for a space'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space to get peer list from'}),
  }
  static topic = 'spaces'

  public async run(): Promise<void> {
    const {platform} = new HerokuSDK()
    const {args, flags} = await this.parse(Index)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc`
          space required.
          USAGE: heroku spaces:peerings my-space
        `)
    }

    const peerings = await platform.peering.list(spaceName)

    if (flags.json)
      displayPeeringsAsJSON(peerings)
    else
      displayPeerings(spaceName as string, peerings)
  }
}
