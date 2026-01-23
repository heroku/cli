import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../../lib/confirmCommand.js'

const heredoc = tsheredoc.default

export default class Destroy extends Command {
  static args = {
    name: Args.string({
      description: 'name or id of the VPN connection to destroy',
      required: true,
    }),
  }

  static description = 'destroys VPN in a private space'
  static examples = [heredoc(`
    ${color.command('heroku spaces:vpn:destroy vpn-connection-name --space example-space --confirm vpn-connection-name')}
    Tearing down VPN Connection vpn-connection-name in space example-space... done
  `)]

  static flags = {
    confirm: flags.string({description: 'set to VPN connection name to bypass confirm prompt', hidden: true}),
    space: flags.string({char: 's', description: 'space name', required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Destroy)
    const {confirm, space} = flags
    const {name} = args

    await new ConfirmCommand().confirm(
      name,
      confirm,
      heredoc`
        Destructive Action
        This command will attempt to destroy the specified VPN Connection in space ${color.space(space)}
      `,
    )

    ux.action.start(`Tearing down VPN Connection ${color.cyan(name)} in space ${color.space(space)}`)
    await this.heroku.delete(`/spaces/${space}/vpn-connections/${name}`)
    ux.action.stop()
  }
}
