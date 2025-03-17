import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {list, set} from '../../lib/accounts/accounts'

export default class Set extends Command {
  static args = {
    name: Args.string({description: 'name of account to add', required: true}),
  }

  async run() {
    const {args} = await this.parse(Set)
    const {name} = args

    if (!list().some(a => a.name === name)) {
      ux.error(`${name} does not exist`)
    }

    set(name)
  }
}
