import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {displayHosts, displayHostsAsJSON, type Host} from '../../lib/spaces/hosts.js'

const heredoc = tsheredoc.default

export default class Hosts extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }
  static description = 'list dedicated hosts for a space'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space to get host list from'}),
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

    const {body: hosts} = await this.heroku.get<Host[]>(`/spaces/${spaceName}/hosts`, {
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
    if (flags.json)
      displayHostsAsJSON(hosts)
    else
      displayHosts(spaceName as string, hosts)
  }
}
