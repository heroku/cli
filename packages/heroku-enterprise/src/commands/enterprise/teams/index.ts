import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../../../base'
import {Accounts} from '../../../completions'

export default class Teams extends BaseCommand {
  static description = 'list teams within an enterprise account'

  static examples = [
    '$ heroku enterprise:teams --enterprise-account=account-name',
  ]

  static flags: any = {
    'enterprise-account': flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      required: true
    }),
    ...cli.table.flags({except: 'extended'})
  }

  async run() {
    const {flags} = this.parse(Teams)
    let {body: teams} = await this.heroku.get<any[]>(`/enterprise-accounts/${flags['enterprise-account']}/teams`)
    if (!teams || teams.length === 0) return this.warn('No enterprise teams to list')

    cli.table(teams,
      {
        name: {
          header: 'Team Name',
        },
        role: {
          header: 'My Roles',
          get: row => row.role || '',
        },
      },
      {
        printLine: this.log,
        ...flags,
      }
    )
  }
}
