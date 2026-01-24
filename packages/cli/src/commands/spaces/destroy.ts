import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {getGeneration} from '../../lib/apps/generation.js'
import ConfirmCommand from '../../lib/confirmCommand.js'
import {displayNat} from '../../lib/spaces/spaces.js'
import {Space} from '../../lib/types/fir.js'

const heredoc = tsheredoc.default

type RequiredSpaceWithNat = {outbound_ips?: Required<Heroku.SpaceNetworkAddressTranslation>} & Required<Space>

export default class Destroy extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }

  static description = heredoc`
    destroy a space
  `
  static examples = [heredoc`
    ${color.command('heroku spaces:destroy --space my-space')}
    Destroying my-space... done
  `]

  static flags = {
    confirm: flags.string({description: 'set to space name to bypass confirm prompt', hasValue: true}),
    space: flags.string({char: 's', description: 'space to destroy'}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Destroy)
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
        const ipv6 = getGeneration(space) === 'fir' ? ' and IPv6' : ''
        natWarning = heredoc`
        ${color.dim('===')} ${color.bold('WARNING: Outbound IPs Will Be Reused')}
        ${color.yellow(`⚠️ Deleting this space frees up the following outbound IPv4${ipv6} IPs for reuse:`)}
        ${color.bold(displayNat(space.outbound_ips) ?? '')}

        ${color.dim('Update the following configurations:')}
        ${color.dim('=')} IP allowlists
        ${color.dim('=')} Firewall rules
        ${color.dim('=')} Security group configurations
        ${color.dim('=')} Network ACLs

        ${color.yellow(`Ensure that you remove the listed IPv4${ipv6} addresses from your security configurations.`)}
      `
      }
    }

    await new ConfirmCommand().confirm(
      spaceName as string,
      confirm,
      `Destructive Action\nThis command will destroy the space ${color.space(spaceName as string)}\n${natWarning}\n`,
    )

    ux.action.start(`Destroying space ${color.space(spaceName as string)}`)
    await this.heroku.delete(`/spaces/${spaceName}`)
    ux.action.stop()
  }
}
