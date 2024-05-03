import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {displayPeerings, displayPeeringsAsJSON} from '../../../lib/spaces/peering'
import heredoc from 'tsheredoc'

export default class Index extends Command {
    static topic = 'spaces';
    static description = 'list peering connections for a space';
    static flags = {
      space: flags.string({char: 's', description: 'space to get peer list from'}),
      json: flags.boolean({description: 'output in json format'}),
    };

    static args = {
      space: Args.string({hidden: true}),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Index)
      const spaceName = flags.space || args.space
      if (!spaceName) {
        ux.error(heredoc`
          space required.
          USAGE: heroku spaces:peerings my-space
        `)
      }

      const {body: peerings} = await this.heroku.get<Heroku.Peering[]>(`/spaces/${spaceName}/peerings`)

      if (flags.json)
        displayPeeringsAsJSON(peerings)
      else
        displayPeerings(spaceName as string, peerings)
    }
}
