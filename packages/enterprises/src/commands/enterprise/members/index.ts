import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import {Accounts} from '../../../completions'

export default class Members extends Command {
  static description = 'list members of the enterprise account and their permissions'

  static examples = [
    '$ heroku enterprise:members --enterprise-account=account-name',
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
    const {flags} = this.parse(Members)
    const enterpriseAccount = flags['enterprise-account']
    const {body: members} = await this.heroku.get<any[]>(`/enterprise-accounts/${enterpriseAccount}/members`)
    if (!members || members.length === 0) return this.warn('No enterprise members to list')

    cli.table(members,
      {
        email: {
          get: row => row.user && row.user.email,
        },
        permissions: {
          get: row => row.permissions.map((p: any) => p.name).join(','),
        },
      },
      {
        printLine: this.log,
        ...flags
      }
    )
  }
}
