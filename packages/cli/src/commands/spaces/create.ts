import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import {displayShieldState} from '../../lib/spaces/spaces'
import {RegionCompletion} from '../../lib/autocomplete/completions'
import {splitCsv} from '../../lib/spaces/parsers'

export default class Create extends Command {
  static topic = 'spaces'
  static description = heredoc`
    create a new space
    Example:

    $ heroku spaces:create --space my-space --team my-team --region oregon
    Creating space my-space in team my-team... done
    === my-space
    ID:         e7b99e37-69b3-4475-ad47-a5cc5d75fd9f
    Team:       my-team
    Region:     oregon
    CIDR:       10.0.0.0/16
    Data CIDR:  172.23.0.0/20
    State:      allocating
    Created at: 2016-01-06T03:23:13Z
  `
  static flags = {
    space: flags.string({char: 's', description: 'name of space to create'}),
    channel: flags.string({hidden: true}),
    region: flags.string({description: 'region name', completion: RegionCompletion}),
    features: flags.string({hidden: true, description: 'a list of features separated by commas'}),
    'log-drain-url': flags.string({hidden: true, description: 'direct log drain url'}),
    shield: flags.boolean({hidden: true, description: 'create a Shield space'}),
    cidr: flags.string({description: 'RFC-1918 CIDR the space will use'}),
    'kpi-url': flags.string({hidden: true, description: 'self-managed KPI endpoint to use'}),
    'data-cidr': flags.string({description: 'RFC-1918 CIDR used by Heroku Data resources for the space'}),
    team: flags.team(),
  };

  static args = {
    space: Args.string({hidden: true}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Create)
    const {channel, region, features, 'log-drain-url': logDrainUrl, shield, cidr, 'kpi-url': kpiUrl, 'data-cidr': dataCidr, team} = flags
    const spaceName = flags.space || args.space

    if (!spaceName) {
      ux.error(heredoc`
        Space name required.
        USAGE: heroku spaces:create --space my-space --team my-team
      `)
    }

    if (!team) {
      ux.error('No team specified')
    }

    const dollarAmountMonthly = shield ? '$3000' : '$1000'
    const dollarAmountHourly = shield ? '$4.17' : '$1.39'
    const spaceType = shield ? 'Shield' : 'Standard'

    ux.action.start(`Creating space ${color.green(spaceName as string)} in team ${color.cyan(team as string)}`)
    const {body: space} = await this.heroku.post<Required<Heroku.Space>>('/spaces', {
      body: {
        name: spaceName, team: team, channel_name: channel, region: region, features: splitCsv(features),
        log_drain_url: logDrainUrl, shield, cidr, kpi_url: kpiUrl, data_cidr: dataCidr,
      },
    })
    ux.action.stop()

    ux.warn(`${color.bold('Spend Alert.')} During the limited GA period, each Heroku ${spaceType} Private Space costs ~${dollarAmountHourly}/hour (max ${dollarAmountMonthly}/month), pro-rated to the second.`)
    ux.warn('Use spaces:wait to track allocation.')

    ux.styledHeader(space.name)
    ux.styledObject({
      ID: space.id, Team: space.team.name, Region: space.region.name, CIDR: space.cidr, 'Data CIDR': space.data_cidr, State: space.state, Shield: displayShieldState(space), 'Created at': space.created_at,
    }, ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Created at'])
  }
}
