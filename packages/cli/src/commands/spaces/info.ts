import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import debug from 'debug'
import {IncomingHttpHeaders} from 'node:http'
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

    const headers: IncomingHttpHeaders = {
      Accept: 'application/vnd.heroku+json; version=3.fir',
    }
    if (!flags.json) {
      headers['Accept-Expansion'] = 'region'
    }

    const {body: space} = await this.heroku.get<SpaceWithOutboundIps>(`/spaces/${spaceName}`, {headers})
    if (space.state === 'allocated') {
      try {
        const {body: outbound_ips} = await this.heroku.get<SpaceNat>(`/spaces/${spaceName}/nat`, {headers: {Accept: 'application/vnd.heroku+json; version=3.fir'}})
        space.outbound_ips = outbound_ips
      } catch (error) {
        spacesDebug(`Retrieving NAT details for the space failed with ${error}`)
      }
    }

    renderInfo(space, flags.json)
  }
}
