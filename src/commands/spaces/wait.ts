import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Notification, notify} from '@heroku-cli/notifications'
import {Args, ux} from '@oclif/core'
import debug from 'debug'
import {IncomingHttpHeaders} from 'node:http'
import tsheredoc from 'tsheredoc'

import {renderInfo} from '../../lib/spaces/spaces.js'
import {SpaceNat} from '../../lib/types/fir.js'
import {SpaceWithOutboundIps} from '../../lib/types/spaces.js'

const heredoc = tsheredoc.default

const spacesDebug = debug('spaces:wait')

export default class Wait extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }

  static description = 'wait for a space to be created'
  static flags = {
    interval: flags.integer({
      char: 'i',
      default: 30,
      description: 'seconds to wait between poll intervals',
    }),
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space to get info of'}),
    timeout: flags.integer({
      char: 't',
      default: 25 * 60,
      description: 'maximum number of seconds to wait',
    }),
  }

  static topic = 'spaces'

  protected notify(spaceName: string) {
    try {
      const notification: {
        message?: string, sound?: boolean, subtitle?: string, title?: string
      } & Notification = {
        message: 'space was successfully created',
        sound: true,
        subtitle: `heroku spaces:wait ${spaceName}`,
        title: spaceName,
      }
      notify(notification)
    } catch (error: any) {
      ux.warn(error)
    }
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Wait)
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
    ux.action.start(`Waiting for space ${color.space(spaceName as string)} to allocate`)

    const headers: IncomingHttpHeaders = {
      Accept: 'application/vnd.heroku+json; version=3.fir',
    }
    if (!flags.json) {
      headers['Accept-Expansion'] = 'region'
    }

    let {body: space} = await this.heroku.get<SpaceWithOutboundIps>(`/spaces/${spaceName}`, {headers})
    while (space.state === 'allocating') {
      if (new Date() > deadline) {
        throw new Error('Timeout waiting for space to become allocated.')
      }

      await this.wait(interval)
      const {body: updatedSpace} = await this.heroku.get<SpaceWithOutboundIps>(`/spaces/${spaceName}`, {headers})
      space = updatedSpace
    }

    try {
      const {body: nat} = await this.heroku.get<SpaceNat>(`/spaces/${spaceName}/nat`, {headers: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
      space.outbound_ips = nat
    } catch (error) {
      spacesDebug(`Retrieving NAT details for the space failed with ${error}`)
    }

    ux.action.stop()
    renderInfo(space, flags.json)
    this.notify(spaceName as string)
  }

  protected wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
