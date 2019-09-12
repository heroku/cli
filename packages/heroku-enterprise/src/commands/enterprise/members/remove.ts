import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import {AccountMembers, Accounts} from '../../../completions'

export default class Remove extends Command {
  static description = 'remove a member from an enterprise account'

  static examples = [
    '$ heroku enterprise:members:remove member-name --enterprise-account=account-name',
  ]

  static aliases = ['enterprise:members-remove']

  static args = [
    {name: 'email', required: true, completion: AccountMembers},
  ]

  static flags = {
    'enterprise-account': flags.string({
      completion: Accounts,
      char: 'e',
      description: 'enterprise account name',
      required: true
    }),
  }

  async run() {
    const {args, flags} = this.parse(Remove)
    const enterpriseAccount = flags['enterprise-account']
    const member = args.email
    const formattedEmail = color.cyan(member)
    const formattedAccount = color.green(enterpriseAccount)

    cli.action.start(`Removing ${formattedEmail} from ${formattedAccount}`)
    await this.heroku.delete(`/enterprise-accounts/${enterpriseAccount}/members/${member}`)
    cli.action.stop()
  }
}
