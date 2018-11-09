import {flags as Flags} from '@heroku-cli/command'
import cli from 'cli-ux'
import * as QueryString from 'querystring'

import BaseCommand from '../../base'
import {Accounts} from '../../completions'

export default class Usage extends BaseCommand {
  static description = 'list the usage for an enterprise account'

  static examples = [
    '$ heroku enterprises:usage --enterprise-account=account-name',
    '$ heroku enterprises:usage --enterprise-account=account-name --team=team-name',
    '$ heroku enterprises:usage --enterprise-account=account-name --columns=\'account,team,app,dyno\'',
    '$ heroku enterprises:usage --enterprise-account=account-name --columns=\'account,team,app,dyno\' --csv',
    '$ heroku enterprises:usage --enterprise-account=account-name --columns=\'account,team,app,addon\' --sort=\'-addon\'',
    '$ heroku enterprises:usage --enterprise-account=account-name --columns=\'account,team,app,addon\' --filter=\'app=myapp\'',
    '$ heroku enterprises:usage --enterprise-account=account-name --columns=\'account,team,app,data\' --sort=\'-data,app\''
  ]

  static flags = {
    'enterprise-account': Flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      required: true
    }),
    team: Flags.string({
      char: 't',
      description: 'team name',
      required: false
    }),
    'start-date': Flags.string({
      description: 'start date of the usage period',
      dependsOn: ['end-date'],
      hidden: true
    }),
    'end-date': Flags.string({
      description: 'end date of the usage period',
      dependsOn: ['start-date'],
      hidden: true
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
    const {flags} = this.parse(Usage)
    this._flags = flags
    const startDate = flags['start-date']
    const endDate = flags['end-date']
    const query = startDate && endDate ? `?${QueryString.stringify({start_date: startDate, end_date: endDate})}` : ''

    if (flags.team) {
      const {body} = await this.heroku.get<any[]>(`/enterprise-accounts/${flags['enterprise-account']}/teams/${flags.team}/usage${query}`)
      if (body.length === 0) {
        cli.warn(`No usage for ${flags.team}`)
        return
      }
      this.displayTeamUsage(body[0])
    } else {
      const {body} = await this.heroku.get<any[]>(`/enterprise-accounts/${flags['enterprise-account']}/usage${query}`)
      const usage: any = body[0]
      const teams = usage.teams
      if (!teams) {
        cli.warn(`No usage for ${flags['enterprise-account']}`)
        return
      }
      this.displayEnterpriseAccoutUsage(teams, usage.name, usage.date)
    }
  }

  private displayTeamUsage(team: any) {
    const usageData: Array<any> = []
    if (team.apps) {
      team.apps.forEach((teamApp: any) => {
        usageData.push({
          date: team.date,
          appName: teamApp.app_name,
          addons: teamApp.addons,
          connect: teamApp.connect,
          data: teamApp.data,
          dynos: teamApp.dynos,
          partner: teamApp.partner
        })
      })
    }

    cli.table(usageData,
      Usage.tableHeaders,
      {
        printLine: this.log,
        ...this._flags,
      }
    )
  }

  private displayEnterpriseAccoutUsage(teams: any, accountName: string, date: string) {
    const usageData: Array<any> = []
    teams.forEach((team: any) => {
      const teamInfo = {
        accountName,
        teamName: team.name,
        date
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

    cli.table(usageData,
      {
        accountName: {header: 'Account'},
        teamName: {header: 'Team'},
        ...Usage.tableHeaders
      },
      {
        printLine: this.log,
        ...this._flags,
      }
    )
  }
}
