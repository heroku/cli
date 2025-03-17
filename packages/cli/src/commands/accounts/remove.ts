import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {current, list, remove} from '../../lib/accounts/accounts'

export default class Remove extends Command {
  static args = {
    name: Args.string({description: 'name of account to add', required: true}),
  }

  async run() {
    const {args} = await this.parse(Remove)
    const {name} = args

    if (!list().some(a => a.name === name)) {
      ux.error(`${name} does not exist`)
    }

    if (current() === name) {
      ux.error(`${name} is the current account`)
    }

    remove(name)
  }
}
