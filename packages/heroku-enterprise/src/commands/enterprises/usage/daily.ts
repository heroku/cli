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
      exclusive: ['team']
    }),
    team: flags.string({
      char: 't',
      description: 'team name'
    }),
    'start-date': flags.string({
      description: 'start date of the usage period, cannot be more than 6 months prior to today (starting 2019-01-01)',
      required: true
    }),
    'end-date': flags.string({
      description: 'end date of the usage period, cannot be more than 31 days after the start date',
      dependsOn: ['start-date'],
      required: true
    }),

    // NOTE: We're getting csv format directly from the API due to better performance and
    //       streaming support.
    csv: flags.boolean({
      description: 'output is csv format',
      required: false
    }),
    ...cli.table.flags({except: ['extended', 'csv']})
  }

  static tableHeaders = {
    appName: {header: 'App'},
    date: {header: 'Date'},
    dynos: {header: 'Dyno'},
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
    const query = `?${QueryString.stringify({start: flags['start-date'], end: flags['end-date']})}`
    const coreService: CoreService = new CoreService(this.heroku)
    if (flags.team) {
      const teamId = await coreService.getTeamId(flags.team)
      const teamEndpoint = `/teams/${teamId}/usage/daily${query}`

      flags.csv ? await this.displayCsvUsageData(teamEndpoint, flags.team)
                : await this.displayUsageData(teamEndpoint, flags.team, true)
    } else {
      const enterpriseAccountName = flags['enterprise-account'] as string
      const accountId = await coreService.getEnterpriseAccountId(enterpriseAccountName)
      const accountEndpoint = `/enterprise-accounts/${accountId}/usage/daily${query}`

      flags.csv ? await this.displayCsvUsageData(accountEndpoint, enterpriseAccountName)
                : await this.displayUsageData(accountEndpoint, enterpriseAccountName, false)
    }
  }

  private async displayUsageData(url: string, usageType: string, isTeam: boolean) {
    this.setHttpHeadersForJSON()

    try {
      cli.action.start(`Getting daily usage data for ${color.cyan(usageType)}`)
      const {body: usageData} = await this.heroku.get<any[]>(url)
      cli.action.stop()
      isTeam ? this.displayTeamUsage(usageData) : this.displayEnterpriseAccoutUsage(usageData)
    } catch (error) {
      throw error
    }
  }

  private async displayCsvUsageData(url: string, usageType: string) {
    this.setHttpHeadersForCSV()

    try {
      cli.action.start(`Getting daily usage data for ${color.cyan(usageType)}`)
      const {response} = await this.heroku.stream(url)
      cli.action.stop()

      await new Promise((resolve, reject) => {
        response.on('end', () => resolve())
        response.on('error', (e: Error) => reject(e))
        response.pipe(process.stdout)
      })
    } catch (error) {
      if (error.body && error.body.error) this.error(error.body.error)
      throw error
    }
  }

  private displayTeamUsage(allTeamUsage: any[]) {
    const usageData: Array<any> = []

    allTeamUsage.forEach((teamUsage: any) => {
      if (teamUsage.apps) {
        teamUsage.apps.forEach((teamApp: any) => {
          usageData.push({
            date: teamUsage.date,
            appName: teamApp.app_name,
            addons: teamApp.addons,
            data: teamApp.data,
            dynos: teamApp.dynos,
            partner: teamApp.partner
          })
        })
      }
    })

    if (usageData.length === 0) return this.warn('No usage data to list')
    cli.table(usageData,
      Daily.tableHeaders,
      {
        printLine: this.log,
        ...this._flags,
      }
    )
  }

  private displayEnterpriseAccoutUsage(allUsage: any[]) {
    const usageData: Array<any> = []

    allUsage.forEach((usage: any) => {
      usage.teams.forEach((team: any) => {
        const teamInfo = {
          accountName: usage.name,
          teamName: team.name,
          date: usage.date
        }

        if (team.apps) {
          team.apps.forEach((teamApp: any) => {
            usageData.push({
              ...teamInfo,
              appName: teamApp.app_name,
              addons: teamApp.addons,
              data: teamApp.data,
              dynos: teamApp.dynos,
              partner: teamApp.partner
            })
          })
        } else {
          usageData.push(teamInfo)
        }
      })
    })

    if (usageData.length === 0) return this.warn('No usage data to list')
    cli.table(usageData,
      {
        accountName: {header: 'Account'},
        teamName: {header: 'Team'},
        ...Daily.tableHeaders
      },
      {
        printLine: this.log,
        ...this._flags,
      }
    )
  }

  private setHttpHeadersForCSV() {
    this.heroku.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'text/csv; version=3.enterprise-accounts',
    }
  }

  private setHttpHeadersForJSON() {
    this.heroku.defaults.headers = {
      ...this.heroku.defaults.headers,
      Accept: 'application/json; version=3.enterprise-accounts',
    }
  }
}
