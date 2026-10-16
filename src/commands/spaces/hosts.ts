import {Command, flags} from '@heroku-cli/command'
import {SpaceCompletion} from '@heroku-cli/command/lib/completions.js'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {createSDK} from '../../lib/sdk.js'
import {displayHosts, displayHostsAsJSON, type Host} from '../../lib/spaces/hosts.js'

const heredoc = tsheredoc

export default class Hosts extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }
  static description = 'list dedicated hosts for a space'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', completion: SpaceCompletion, description: 'space to get host list from'}),
  }
  static hidden = true
  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Hosts)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const {platform} = createSDK(this.heroku)
    const hosts = await platform.spaceHost.list(spaceName as string) as Host[]
    if (flags.json)
      displayHostsAsJSON(hosts)
    else
      displayHosts(spaceName as string, hosts)
  }
}
