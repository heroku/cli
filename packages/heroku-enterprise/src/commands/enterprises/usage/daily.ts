import color from '@heroku-cli/color'
import {flags} from '@heroku-cli/command'
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
    '$ heroku enterprises:usage:daily --enterprise-account=account-name --start-date=2019-01-01 --end-date=2019-01-15 --csv',
    '$ heroku enterprises:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 --csv',
    '$ heroku enterprises:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 --csv | less',
    '$ heroku enterprises:usage:daily --team=team-name --start-date=2019-01-01 --end-date=2019-01-15 --csv > /tmp/usage.csv',
  ]

  static flags = {
    'enterprise-account': flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      exclusive: ['team'],
      required: false
    }),
    team: flags.string({
      char: 't',
      description: 'team name',
      required: false
    }),
    'start-date': flags.string({
      description: 'start date of the usage period, cannot be more than 3 months prior to today (starting 2019-01-01)',
      required: true
    }),
    'end-date': flags.string({
      description: 'end date of the usage period, cannot be more than 31 days after the start date',
      dependsOn: ['start-date'],
      required: true
    }),
    csv: flags.boolean({
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

  private readonly MAX_DAYS = 31 * 24 * 60 * 60 * 1000

  async run() {
    const {flags} = this.parse(Daily)

    if (!flags['enterprise-account'] && !flags.team) {
      this.error(`You must specify usage for either ${'--enterprise-account(-e)'} or ${'--team(-t)'}`)
    }

    const startDate: any = new Date(flags['start-date'])
    const endDate: any = new Date(flags['end-date'])

    // TODO: change this to be dynamic on 2019-04-01
    if (startDate < new Date('2019-01-01')) {
      this.error('Invalid --start-date. Usage data not available before 2019-01-01')
    }
    if (Math.abs(endDate - startDate) > this.MAX_DAYS) {
      this.error('Cannot request more than 31 days of usage')
    }

    const query = `?${QueryString.stringify({start: flags['start-date'], end: flags['end-date']})}`
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
    const {response} = await this.heroku.stream(url)
    cli.action.stop()

    await new Promise((resolve, reject) => {
      response.on('end', () => resolve())
      response.on('error', (e: Error) => reject(e))
      response.pipe(process.stdout)
    })
  }

  private setHttpHeadersForCSV() {
    this.heroku.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'text/csv; version=3.enterprise-accounts',
    }
  }
}
