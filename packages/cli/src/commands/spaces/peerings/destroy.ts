import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirmCommand.js'

const heredoc = tsheredoc.default

export default class Destroy extends Command {
  static args = {
    pcxid: Args.string({hidden: true}),
  }

  static description = 'destroys an active peering connection in a private space'
  static example = heredoc(`
    $ heroku spaces:peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
    Tearing down peering connection pcx-4bd27022... done
  `)

  static flags = {
    confirm: flags.string({description: 'set to PCX ID to bypass confirm prompt'}),
    pcxid: flags.string({char: 'p', description: 'PCX ID of a pending peering'}),
    space: flags.string({
      char: 's',
      description: 'space to get peering info from',
      required: true,
    }),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Destroy)

    const pcxID = flags.pcxid || args.pcxid
    if (!pcxID) {
      ux.error(heredoc`
        pcxid required.
        USAGE: heroku spaces:peering:destroy pcx-4bd27022
      `)
    }

    await new ConfirmCommand().confirm(pcxID as string, flags.confirm, heredoc(`
      Destructive Action
      This command will attempt to destroy the peering connection ${color.warning(pcxID)}
    `))
    ux.action.start(`Tearing down peering connection ${color.name(pcxID)}`)
    await this.heroku.delete(`/spaces/${flags.space}/peerings/${pcxID}`)
    ux.action.stop()
  }
}
