import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import {Accounts} from '../../../completions'
import {CoreService} from '../../../core-service'

export default class Audits extends Command {
  static description = 'list available audit logs for an enterprise account'
  static examples = [
    '$ heroku enterprise:audits --enterprise-account=account-name',
  ]

  static flags: any = {
    'enterprise-account': flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      required: true
    }),
    json: flags.boolean({
      description: 'display as json',
    }),
    ...cli.table.flags({only: 'extended'})
  }

  async run() {
    const {flags} = this.parse(Audits)
    const coreService: CoreService = new CoreService(this.heroku)

    const enterpriseAccountId = await coreService.getEnterpriseAccountId(flags['enterprise-account'])
    const {body: archives} = await this.heroku.get<any[]>(`/enterprise-accounts/${enterpriseAccountId}/archives`)

    if (!archives || archives.length === 0) return this.warn('No enterprise audit logs to list')
    if (flags.json) return this.log(JSON.stringify(archives))

    const auditLogs: {date: string, checksum: string, size: number}[] = []
    archives.forEach(archives => auditLogs.push({
      date: `${archives.year}-${archives.month}`,
      checksum: archives.checksum,
      size: archives.size
    }))
    cli.table(auditLogs,
      {
        date: {
          header: 'Audit Log'
        },
        checksum: {
          extended: true
        },
        size: {
          extended: true
        }
      },
      {
        printLine: this.log,
        ...flags
      }
    )
  }
}
