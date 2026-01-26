import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Accept extends Command {
  static args = {
    pcxid: Args.string({hidden: true}),
    space: Args.string({hidden: true}),
  }

  static description = 'accepts a pending peering request for a private space'
  static examples = [heredoc(`
${color.command('heroku spaces:peerings:accept pcx-4bd27022 --space example-space')}
Accepting and configuring peering connection pcx-4bd27022`)]

  static flags = {
    pcxid: flags.string({char: 'p', description: 'PCX ID of a pending peering'}),
    space: flags.string({char: 's', description: 'space to get peering info from'}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Accept)
    const space = flags.space || args.space
    if (!space) {
      throw new Error('Space name required.\nUSAGE: heroku spaces:peerings:accept pcx-12345678 --space my-space')
    }

    const pcxID = flags.pcxid || args.pcxid
    await this.heroku.post(`/spaces/${space}/peerings`, {
      body: {pcx_id: pcxID},
      headers: {Accept: 'application/vnd.heroku+json; version=3.dogwood'},
    })
    ux.stdout(`Accepting and configuring peering connection ${color.cyan.bold(pcxID)}`)
  }
}
