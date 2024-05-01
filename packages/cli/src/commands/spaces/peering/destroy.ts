import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import confirmCommand from '../../../lib/confirmCommand'

export default class Destroy extends Command {
  static topic = 'spaces'
  static description = 'destroys an active peering connection in a private space'
  static flags = {
    pcxid: flags.string({char: 'p', description: 'PCX ID of a pending peering'}),
    space: flags.string({
      char: 's',
      description: 'space to get peering info from',
      required: true,
    }),
    confirm: flags.string({description: 'set to PCX ID to bypass confirm prompt'}),
  };

  static args = {
    pcxid: Args.string({hidden: true}),
  }

  static example = heredoc(`
    $ heroku spaces:peerings:destroy pcx-4bd27022 --confirm pcx-4bd27022 --space example-space
    Tearing down peering connection pcx-4bd27022... done
  `)

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Destroy)

    const pcxID = flags.pcxid || args.pcxid
    if (!pcxID) {
      ux.error(heredoc`
        pcxid required.
        USAGE: heroku spaces:destroy my-space
      `)
    }

    await confirmCommand(pcxID as string, flags.confirm, heredoc(`
      Destructive Action
      This command will attempt to destroy the peering connection ${color.bold.red(pcxID)}
    `))
    ux.action.start(`Tearing down peering connection ${color.cyan.bold(pcxID)}`)
    await this.heroku.delete(`/spaces/${flags.space}/peerings/${pcxID}`)
    ux.action.stop()
  }
}
