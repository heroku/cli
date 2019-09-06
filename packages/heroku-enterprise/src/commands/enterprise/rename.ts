import {color} from '@heroku-cli/color'
import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../../base'
import {Accounts} from '../../completions'
import {CoreService} from '../../core-service'

export default class Rename extends BaseCommand {
  static description = 'rename the enterprise account'
  static examples = [
    '$ heroku enterprise:rename new-account-name --enterprise-account=account-name'
  ]
  static args = [
    {name: 'newAccountName', description: 'new enterprise account name', required: true}
  ]
  static flags: any = {
    'enterprise-account': flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      required: true
    })
  }

  async run() {
    const {args, flags} = this.parse(Rename)
    const coreService: CoreService = new CoreService(this.heroku)
    const enterpriseAccountId = await coreService.getEnterpriseAccountId(flags['enterprise-account'])

    cli.action.start(`Renaming enterprise account from ${color.cyan(flags['enterprise-account'])} to ${color.cyan(args.newAccountName)}`)
    await this.heroku.patch(`/enterprise-accounts/${enterpriseAccountId}`, {body: {name: args.newAccountName}})
    cli.action.stop()
  }
}
