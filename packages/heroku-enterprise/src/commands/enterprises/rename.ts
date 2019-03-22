import {color} from '@heroku-cli/color'
import {cli} from 'cli-ux'

import BaseCommand from '../../base'
import {CoreService} from '../../core-service'

export default class Rename extends BaseCommand {
  static description = 'rename the enterprise account name'
  static examples = [
    '$ heroku enterprises:rename account_name new_account_name'
  ]
  static args = [
    {name: 'accountName', description: 'enterprise account name', required: true},
    {name: 'newAccountName', description: 'new enterprise account name', required: true}
  ]

  async run() {
    const {args} = this.parse(Rename)
    const coreService: CoreService = new CoreService(this.heroku)
    const enterpriseAccountId = await coreService.getEnterpriseAccountId(args.accountName)

    cli.action.start(`Renaming enterprise account from ${color.cyan(args.accountName)} to ${color.cyan(args.newAccountName)}`)
    await this.heroku.patch(`/enterprise-accounts/${enterpriseAccountId}`, {body: {name: args.newAccountName}})
    cli.action.stop()
  }
}
