import color from '@heroku-cli/color'
import {flags as Flags} from '@heroku-cli/command'
import cli from 'cli-ux'
import * as QueryString from 'querystring'

import BaseCommand from '../../../base'
import {Accounts} from '../../../completions'
import {CoreService} from '../../../core-service'

export default class Daily extends BaseCommand {
  static description = `list the daily usage for an enterprise account or team
Displays the daily usage data for an enterprise account or team.

NOTE: While we strive to provide the most accurate usage information, the data
presented here may not reflect license usage or billing for your account.`

  static examples = [
    '$ heroku enterprises:usage:daily --enterprise-account=account-name --start-date=2018-12-15 --end-date=2019-01-15 --csv',
    '$ heroku enterprises:usage:daily --team=team-name --start-date=2018-12-15 --end-date=2019-01-15 --csv',
    '$ heroku enterprises:usage:daily --team=team-name --start-date=2018-12-15 --end-date=2019-01-15 --csv | less',
    '$ heroku enterprises:usage:daily --team=team-name --start-date=2018-12-15 --end-date=2019-01-15 --csv > /tmp/usage.csv',
  ]

  static flags = {
    'enterprise-account': Flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      exclusive: ['team'],
      required: false
    }),
    team: Flags.string({
      char: 't',
      description: 'team name',
      required: false
    }),
    'start-date': Flags.string({
      description: 'start date of the usage period (must be no more than 90 days ago, starting 2019-01-01)',
      required: true
    }),
    'end-date': Flags.string({
      description: 'end date of the usage period (must be no more than 30 days from --start-date)',
      dependsOn: ['start-date'],
      required: true
    }),
    csv: Flags.boolean({
      description: 'output is csv format',
      required: true
    })
  }

  static tableHeaders = {
    appName: {header: 'App'},
    date: {header: 'Date'},
    dynos: {header: 'Dyno'},
    connect: {header: 'Connect'},
    addons: {header: 'Addon'},
    partner: {header: 'Partner'},
    data: {header: 'Data'}
  }

  private _flags: any

  async run() {
    const {flags} = this.parse(Daily)

    if (!flags['enterprise-account'] && !flags.team) {
      this.error(`You must specify usage for either ${'--enterprise-account(-e)'} or ${'--team(-t)'}`)
    }

    this._flags = flags
    const startDate = flags['start-date']

    // TODO: remove this on 2019-04-01
    if (new Date(startDate) < new Date('2019-01-01')) {
      this.error('Invalid --start-date. Usage data not available before 2019-01-01')
    }

    const endDate = flags['end-date']
    const query = `?${QueryString.stringify({start: startDate, end: endDate})}`

    const coreService: CoreService = new CoreService(this.heroku)
    if (flags.team) {
      const teamId = await coreService.getTeamId(flags.team)
      await this.displayCsvUsageData(`/teams/${teamId}/usage/daily${query}`, flags.team)
    } else {
      const enterpriseAccountName = flags['enterprise-account'] as string
      const accountId = await coreService.getEnterpriseAccountId(enterpriseAccountName)
      await this.displayCsvUsageData(`/enterprise-accounts/${accountId}/usage/daily${query}`, enterpriseAccountName)
    }
  }

  private async displayCsvUsageData(url: string, usageType: string) {
    this.setHttpHeadersForCSV()

    cli.action.start(`Getting daily usage data for ${color.cyan(usageType)}`)
    const {response} = await this.heroku.stream(`${url}`)
    cli.action.stop()

    await new Promise((resolve, reject) => {
      response.on('data', (data: any) => {
        process.stdout.write(data.toString())
      })
      response.on('end', () => {
        resolve()
      })
      response.on('error', () => {
        reject()
      })
    })
  }

  private setHttpHeadersForCSV() {
    this.heroku.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'text/csv; version=3.enterprise-accounts',
    }
  }
}
