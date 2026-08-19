import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'
import debug from 'debug'
import tsheredoc from 'tsheredoc'

import {renderInfo} from '../../lib/spaces/spaces.js'
import {SpaceNat} from '../../lib/types/fir.js'
import {SpaceWithOutboundIps} from '../../lib/types/spaces.js'

const heredoc = tsheredoc.default

const spacesDebug = debug('spaces:info')

export default class Info extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }
  static description = 'show info about a space'
  static example = `${color.command('heroku spaces:info my-space')}`
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space to get info of'}),
  }
  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Info)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const {platform} = new HerokuSDK()
    const headers: Record<string, string> = {
      Accept: 'application/vnd.heroku+json; version=3.fir',
    }
    if (!flags.json) {
      headers['Accept-Expansion'] = 'region'
    }

    const space = await platform.withHeaders(headers).space.info(spaceName as string) as SpaceWithOutboundIps
    if (space.state === 'allocated') {
      try {
        space.outbound_ips = await platform
          .withHeaders({Accept: 'application/vnd.heroku+json; version=3.fir'})
          .spaceNat.info(spaceName as string) as SpaceNat
      } catch (error) {
        spacesDebug(`Retrieving NAT details for the space failed with ${error}`)
      }
    }

    renderInfo(space, flags.json)
  }
}
