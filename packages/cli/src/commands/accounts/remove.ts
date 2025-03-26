import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {current, list, remove} from '../../lib/accounts/accounts'

export default class Remove extends Command {
  static description = 'remove a Heroku account from your cache'

  static args = {
    name: Args.string({description: 'name of Heroku account to remove', required: true}),
  }

  static example = 'heroku accounts:remove my-account'

  async run() {
    const {args} = await this.parse(Remove)
    const {name} = args

    if (!list().some(a => a.name === name)) {
      ux.error(`${name} doesn't exist in your accounts cache.`)
    }

    if (current() === name) {
      ux.error(`${name} is the current account.`)
    }

    remove(name)
  }
}
