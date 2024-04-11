import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import confirmApp from '../../lib/apps/confirm-app'
import {displayNat} from '../../lib/spaces/spaces'

type RequiredSpaceWithNat = Required<Heroku.Space> & {outbound_ips?: Required<Heroku.SpaceNetworkAddressTranslation>}

export default class Destroy extends Command {
  static topic = 'spaces'
  static description = heredoc`
    destroy a space
    Example:

    $ heroku spaces:destroy --space my-space
    Destroying my-space... done
  `
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
        natWarning = heredoc`
          The Outbound IPs for this space will be reused!
          Ensure that external services no longer allow these Outbound IPs: ${displayNat(space.outbound_ips)}
        `
      }
    }

    await confirmApp(spaceName as string, confirm, heredoc`
      Destructive Action
      This command will destroy the space ${color.bold.red(spaceName as string)}
      ${natWarning}
    `)

    ux.action.start(`Destroying space ${color.cyan(spaceName as string)}`)
    await this.heroku.delete(`/spaces/${spaceName}`)
    ux.action.stop()
  }
}
