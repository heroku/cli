import {cli} from 'cli-ux'

import BaseCommand from '../../base'

export default class Enterprises extends BaseCommand {
  static description = 'list your enterprise accounts'

  static examples = [
    '$ heroku enterprise',
  ]

  async run() {
    const {body: enterpriseAccounts} = await this.heroku.get<any[]>('/enterprise-accounts')
    if (!enterpriseAccounts || enterpriseAccounts.length === 0) return this.warn('No enterprise accounts to list')

    cli.table(enterpriseAccounts,
      {
        name: {
          header: 'Enterprise Name'
        },
      },
      {
        printLine: this.log,
      }
    )
  }
}
