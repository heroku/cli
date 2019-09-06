import {color} from '@heroku-cli/color'
import {flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'

import BaseCommand from '../../../base'
import {Accounts} from '../../../completions'

export default class Create extends BaseCommand {
  static description = 'create a team in an enterprise account'

  static examples = [
    '$ heroku enterprise:teams:create team-name --enterprise-account=account-name',
  ]

  static args = [
    {name: 'team', description: 'name of the team to create'},
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
    const {args, flags} = this.parse(Create)
    const account = flags['enterprise-account']
    const team = args.team

    cli.action.start(`Creating ${color.cyan(team)} in ${color.green(account)}`)
    await this.heroku.post(`/enterprise-accounts/${account}/teams`, {body: {name: team}})
    cli.action.stop()
  }
}
