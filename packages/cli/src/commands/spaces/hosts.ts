import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {displayHostsAsJSON, displayHosts, type Host} from '../../lib/spaces/hosts'

export default class Hosts extends Command {
  static topic = 'spaces'
  static hidden = true
  static description = 'list dedicated hosts for a space'
  static flags = {
    space: flags.string({char: 's', description: 'space to get host list from'}),
    json: flags.boolean({description: 'output in json format'}),
  }

  static args = {
    space: Args.string({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Hosts)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const {body: hosts} = await this.heroku.get<Host[]>(
      `/spaces/${spaceName}/hosts`,
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'}
    )
    if (flags.json)
      displayHostsAsJSON(hosts)
    else
      displayHosts(spaceName as string, hosts)
  }
}
