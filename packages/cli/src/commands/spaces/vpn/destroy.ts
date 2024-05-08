import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import confirmCommand from '../../../lib/confirmCommand'
import heredoc from 'tsheredoc'

export default class Destroy extends Command {
  static topic = 'spaces'
  static description = 'destroys VPN in a private space'
  static examples = [heredoc`
    $ heroku spaces:vpn:destroy vpn-connection-name --space example-space --confirm vpn-connection-name
    Tearing down VPN Connection vpn-connection-name in space example-space
  `]

  static flags = {
    space: flags.string({char: 's', description: 'space name', required: true}),
    confirm: flags.string({description: 'set to VPN connection name to bypass confirm prompt', hidden: true}),
  }

  static args = {
    name: Args.string({description: 'name of the VPN connection to destroy', required: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Destroy)
    const {space, confirm} = flags
    const {name} = args

    await confirmCommand(
      name,
      confirm,
      heredoc`
        Destructive Action
        This command will attempt to destroy the specified VPN Connection in space ${color.green(space)}
      `,
    )

    ux.action.start(`Tearing down VPN Connection ${color.cyan(name)} in space ${color.cyan(space)}`)
    await this.heroku.delete(`/spaces/${space}/vpn-connections/${name}`)
    ux.action.stop()
  }
}
