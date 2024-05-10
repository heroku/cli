import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import Spinner from '@oclif/core/lib/cli-ux/action/spinner'
import debug from 'debug'
import {renderInfo} from '../../lib/spaces/spaces'
import {Notification, notify} from '@heroku-cli/notifications'

const spacesDebug = debug('spaces:wait')

export default class Wait extends Command {
  static topic = 'spaces'
  static description = 'wait for a space to be created'
  static flags = {
    space: flags.string({char: 's', description: 'space to get info of'}),
    json: flags.boolean({description: 'output in json format'}),
    interval: flags.integer({
      char: 'i',
      description: 'seconds to wait between poll intervals',
      default: 30,
    }),
    timeout: flags.integer({
      char: 't',
      description: 'maximum number of seconds to wait',
      default: 25 * 60,
    }),
  }

  static args = {
    space: Args.string({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Wait)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const interval = flags.interval * 1000
    const timeout = flags.timeout * 1000
    const deadline = new Date(Date.now() + timeout)
    const action = new Spinner()
    action.start(`Waiting for space ${color.green(spaceName as string)} to allocate`)
    let headers = {}
    if (!flags.json) {
      headers = {'Accept-Expansion': 'region'}
    }

    let {body: space} = await this.heroku.get<Heroku.Space>(`/spaces/${spaceName}`, {headers})
    while (space.state === 'allocating') {
      if (new Date() > deadline) {
        throw new Error('Timeout waiting for space to become allocated.')
      }

      await this.wait(interval)
      const {body: updatedSpace} = await this.heroku.get<Heroku.Space>(`/spaces/${spaceName}`, {headers})
      space = updatedSpace
    }

    try {
      const {body: nat} = await this.heroku.get<Heroku.SpaceNetworkAddressTranslation>(`/spaces/${spaceName}/nat`)
      space.outbound_ips = nat
    } catch (error) {
      spacesDebug(`Retrieving NAT details for the space failed with ${error}`)
    }

    action.stop()
    renderInfo(space, flags.json)
    this.notify(spaceName as string)
  }

  protected wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected notify(spaceName: string) {
    try {
      const notification: Notification & {
        sound?: boolean, message?: string, title?: string, subtitle?: string
      } = {
        title: spaceName,
        subtitle: `heroku spaces:wait ${spaceName}`,
        message: 'space was successfully created',
        sound: true,
      }
      notify(notification)
    } catch (error: any) {
      ux.warn(error)
    }
  }
}
