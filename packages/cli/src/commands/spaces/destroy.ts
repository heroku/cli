import {Args, ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import confirmCommand from '../../lib/confirmCommand'
import {displayNat} from '../../lib/spaces/spaces'
import color from '@heroku-cli/color'
import {Space} from '../../lib/types/fir'

type RequiredSpaceWithNat = Required<Space> & {outbound_ips?: Required<Heroku.SpaceNetworkAddressTranslation>}

export default class Destroy extends Command {
  static topic = 'spaces'
  static description = heredoc`
    destroy a space
  `
  static examples = [heredoc`
    $ heroku spaces:destroy --space my-space
    Destroying my-space... done
  `]

  static flags = {
    space: flags.string({char: 's', description: 'space to destroy'}),
    confirm: flags.string({description: 'set to space name to bypass confirm prompt', hasValue: true}),
  }

  static args = {
    space: Args.string({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Destroy)
    const {confirm} = flags
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc`
        Space name required.
        USAGE: heroku spaces:destroy my-space
      `)
    }

    let natWarning = ''
    const {body: space} = await this.heroku.get<RequiredSpaceWithNat>(`/spaces/${spaceName}`)

    if (space.state === 'allocated') {
      ({body: space.outbound_ips} = await this.heroku.get<Required<Heroku.SpaceNetworkAddressTranslation>>(`/spaces/${spaceName}/nat`))
      if (space.outbound_ips && space.outbound_ips.state === 'enabled') {
        if (space.generation?.name === 'fir') {
          natWarning = heredoc`
          ${color.dim('===')} ${color.bold('WARNING: Outbound IPs Will Be Reused')}
          ${color.yellow('⚠️ The following outbound IPs (IPv4 and IPv6) will become available for reuse:')}
          ${color.bold(displayNat(space.outbound_ips) ?? '')}

          ${color.dim('Please update the following configurations:')}
          ${color.dim('=')} IP allowlists
          ${color.dim('=')} Firewall rules
          ${color.dim('=')} Security group configurations
          ${color.dim('=')} Network ACLs

          ${color.yellow('Ensure all IPv4 and IPv6 addresses are removed from your security configurations.')}
        `
        } else {
          natWarning = heredoc`
          ${color.dim('===')} ${color.bold('WARNING: Outbound IPs Will Be Reused')}
          ${color.yellow('⚠️ The following outbound IPs will become available for reuse:')}
          ${color.bold(displayNat(space.outbound_ips) ?? '')}
        `
        }
      }
    }

    await confirmCommand(
      spaceName as string,
      confirm,
      `Destructive Action\nThis command will destroy the space ${color.bold.red(spaceName as string)}\n${natWarning}\n`,
    )

    ux.action.start(`Destroying space ${color.cyan(spaceName as string)}`)
    await this.heroku.delete(`/spaces/${spaceName}`)
    ux.action.stop()
  }
}
