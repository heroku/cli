import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {RegionCompletion} from '@heroku-cli/command/lib/completions.js'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {getGeneration} from '../../lib/apps/generation.js'
import {splitCsv} from '../../lib/spaces/parsers.js'
import {displayShieldState} from '../../lib/spaces/spaces.js'
import {Space} from '../../lib/types/fir.js'

const heredoc = tsheredoc.default

export default class Create extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }

  static description = heredoc`
    create a new space
  `
  static examples = [heredoc`
    Example:

    ${color.command('heroku spaces:create --space my-space --team my-team --region oregon')}
    Creating space my-space in team my-team... done
    === my-space
    ID:         e7b99e37-69b3-4475-ad47-a5cc5d75fd9f
    Team:       my-team
    Region:     oregon
    CIDR:       10.0.0.0/16
    Data CIDR:  172.23.0.0/20
    State:      allocating
    Generation: cedar
    Created at: 2016-01-06T03:23:13Z
  `]

  static flags = {
    channel: flags.string({hidden: true}),
    cidr: flags.string({description: 'RFC-1918 CIDR the space will use'}),
    'data-cidr': flags.string({description: 'RFC-1918 CIDR used by Heroku Data resources for the space'}),
    features: flags.string({description: 'a list of features separated by commas', hidden: true}),
    generation: flags.string({default: 'cedar', description: 'generation for space', options: ['cedar', 'fir']}),
    'kpi-url': flags.string({description: 'self-managed KPI endpoint to use', hidden: true}),
    'log-drain-url': flags.string({description: 'direct log drain url', hidden: true}),
    region: flags.string({completion: RegionCompletion, description: 'region name'}),
    shield: flags.boolean({description: 'create a Shield space', hidden: true}),
    space: flags.string({char: 's', description: 'name of space to create'}),
    team: flags.team({required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Create)
    const {channel, cidr, 'data-cidr': dataCidr, features, generation, 'kpi-url': kpiUrl, 'log-drain-url': logDrainUrl, region, shield, team} = flags
    const spaceName = flags.space || args.space

    if (!spaceName) {
      ux.error(heredoc`
        Space name required.
        USAGE: heroku spaces:create --space my-space --team my-team
      `)
    }

    const dollarAmountMonthly = shield ? '$3000' : '$1000'
    const dollarAmountHourly = shield ? '$4.17' : '$1.39'
    const spaceType = shield ? 'Shield' : 'Standard'

    ux.action.start(`Creating space ${color.space(spaceName as string)} in team ${color.cyan(team as string)}`)
    const {body: space} = await this.heroku.post<Required<Space>>('/spaces', {
      body: {
        channel_name: channel,
        cidr,
        data_cidr: dataCidr,
        features: splitCsv(features),
        generation,
        kpi_url: kpiUrl,
        log_drain_url: logDrainUrl,
        name: spaceName,
        region,
        shield,
        team,
      },
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    ux.action.stop()

    ux.warn(`${color.warning('Spend Alert.')} Each Heroku ${spaceType} Private Space costs ~${dollarAmountHourly}/hour (max ${dollarAmountMonthly}/month), pro-rated to the second.`)
    ux.warn(`Use ${color.code('heroku spaces:wait')} to track allocation.`)

    hux.styledHeader(color.space(space.name))
    hux.styledObject({
      // eslint-disable-next-line perfectionist/sort-objects
      ID: space.id, Team: color.team(space.team.name || ''), Region: space.region.name, CIDR: space.cidr, 'Data CIDR': space.data_cidr, State: space.state, Shield: displayShieldState(space), Generation: getGeneration(space), 'Created at': space.created_at,
    }, ['ID', 'Team', 'Region', 'CIDR', 'Data CIDR', 'State', 'Shield', 'Generation', 'Created at'])
  }
}
