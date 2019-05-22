import {flags} from '@heroku-cli/command'
import cli from 'cli-ux'
import * as QueryString from 'querystring'

import BaseCommand from '../../../base'
import {Accounts} from '../../../completions'

export default class Monthly extends BaseCommand {
  static description = `list the monthly usage for an enterprise account or team
Displays the monthly usage data for an enterprise account or team.

NOTE: While we strive to provide the most accurate usage information, the data
presented here may not reflect license usage or billing for your account.`

  static examples = [
    '$ heroku enterprises:usage:monthly --enterprise-account=account-name',
    '$ heroku enterprises:usage:monthly --enterprise-account=account-name --columns=\'account,team,app,dyno\'',
    '$ heroku enterprises:usage:monthly --enterprise-account=account-name --columns=\'account,team,app,dyno\' --csv',
    '$ heroku enterprises:usage:monthly --enterprise-account=account-name --columns=\'account,team,app,addon\' --sort=\'-addon\'',
    '$ heroku enterprises:usage:monthly --enterprise-account=account-name --columns=\'account,team,app,addon\' --filter=\'app=myapp\'',
    '$ heroku enterprises:usage:monthly --enterprise-account=account-name --columns=\'account,team,app,data\' --sort=\'-data,app\'',
    '$ heroku enterprises:usage:monthly --team=team-name --start-date 2019-01-15 --end-date 2019-03-01',
    '$ heroku enterprises:usage:monthly --team-team-name --columns=\'account,team,app,data\' --sort=\'-data,app\''
  ]

  static flags: any = {
    'enterprise-account': flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      exclusive: ['team']
    }),
    team: flags.string({
      char: 't',
      description: 'team name',
    }),
    'start-date': flags.string({
      description: 'start date of the usage period'
    }),
    'end-date': flags.string({
      description: 'end date of the usage period',
      dependsOn: ['start-date']
    }),
    ...cli.table.flags({except: 'extended'})
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
    const {flags} = this.parse(Monthly)
    if (!flags['enterprise-account'] && !flags.team) {
      this.error(`You must specify usage for either ${'--enterprise-account(-e)'} or ${'--team(-t)'}`)
    }

    this._flags = flags
    const startDate = flags['start-date']
    const endDate = flags['end-date']
    let query = ''

    if (startDate && endDate) query = `?${QueryString.stringify({start_date: startDate, end_date: endDate})}`
    else if (startDate && !endDate) query = `?${QueryString.stringify({start_date: startDate})}`

    if (flags.team) {
      const {body: teamUsages} = await this.heroku.get<any[]>(`/teams/${flags.team}/usage/monthly${query}`)
      this.displayTeamUsage(teamUsages)
    } else {
      const {body: accountUsages} = await this.heroku.get<any[]>(`/enterprise-accounts/${flags['enterprise-account']}/usage${query}`)
      this.displayEnterpriseAccoutUsage(accountUsages)
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
            connect: teamApp.connect,
            data: teamApp.data,
            dynos: teamApp.dynos,
            partner: teamApp.partner
          })
        })
      }
    })

    if (usageData.length === 0) return this.warn('No usage data to list')
    cli.table(usageData,
      Monthly.tableHeaders,
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
              connect: teamApp.connect,
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
        ...Monthly.tableHeaders
      },
      {
        printLine: this.log,
        ...this._flags,
      }
    )
  }
}
