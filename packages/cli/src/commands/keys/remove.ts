import {Args, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {Command} from '@heroku-cli/command'

export default class Remove extends Command {
  static description = 'remove an SSH key from the user'
  static example = `$ heroku keys:remove email@example.com
Removing email@example.com SSH key... done`
  static args = {
    key: Args.string({required: true, description: 'The email address of the user to remove keys for.'}),
  }

  async run() {
    const {args} = await this.parse(Remove)

    ux.action.start(`Removing ${color.cyan(args.key)} SSH key`)
    const {body: keys} = await this.heroku.get<Heroku.Key[]>('/account/keys')
    if (keys.length === 0) {
      throw new Error('No SSH keys on account')
    }

    const toRemove = keys.filter(k => k.comment === args.key)
    if (toRemove.length === 0) {
      throw new Error(`SSH Key ${color.red(args.key)} not found.
Found keys: ${color.yellow(keys.map(k => k.comment).join(', '))}.`)
    }

    await Promise.all(toRemove.map(key => this.heroku.delete(`/account/keys/${key.id}`)))
    ux.action.stop()
  }
}

