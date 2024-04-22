import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import {renderInfo} from '../../lib/spaces/spaces'
import debug from 'debug'

const pgDebug = debug('pg')

export default class Info extends Command {
  static topic = 'spaces'
  static description = 'show info about a space'
  static example = '$ heroku spaces:info my-space'

  static flags = {
    space: flags.string({char: 's', description: 'space to get info of'}),
    json: flags.boolean({description: 'output in json format'}),
  }

  static args = {
    space: Args.string({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Info)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    let headers = {}
    if (!flags.json) {
      headers = {'Accept-Expansion': 'region'}
    }

    const {body: space} = await this.heroku.get<Heroku.Space>(`/spaces/${spaceName}`, {headers})
    if (space.state === 'allocated') {
      try {
        const {body: outbound_ips} = await this.heroku.get<Heroku.SpaceNetworkAddressTranslation>(`/spaces/${spaceName}/nat`)
        space.outbound_ips = outbound_ips
      } catch (error) {
        pgDebug(`Retrieving NAT details for the space failed with ${error}`)
      }
    }

    renderInfo(space, flags.json)
  }
}
// function render(space, flags) {
//   if (flags.json) {
//     ux.log(JSON.stringify(space, null, 2))
//   } else {
//     ux.styledHeader(space.name)
//     ux.styledObject({
//       ID: space.id, Team: space.team.name, Region: space.region.description, CIDR: space.cidr, 'Data CIDR': space.data_cidr, State: space.state, Shield: lib.displayShieldState(space), 'Outbound IPs': lib.displayNat(space.outbound_ips), 'Created at': space.created_at,
//     }, ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Outbound IPs', 'Created at'])
//   }
// }
