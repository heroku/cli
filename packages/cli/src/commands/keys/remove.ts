import {color} from '@heroku/heroku-cli-util'
import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

export default class Remove extends Command {
  static args = {
    key: Args.string({description: 'email address of the user', required: true}),
  }

  static description = 'remove an SSH key from the user'
  static example = `$ heroku keys:remove email@example.com
Removing email@example.com SSH key... done`

  async run() {
    const {args} = await this.parse(Remove)

    ux.action.start(`Removing ${color.cyan(args.key)} SSH key`)
    const {body: keys} = await this.heroku.get<Heroku.Key[]>('/account/keys')
    if (keys.length === 0) {
      throw new Error('No SSH keys on account')
    }

    const toRemove = keys.filter(k => k.comment === args.key)
    if (toRemove.length === 0) {
      throw new Error(`SSH Key ${color.failure(args.key)} not found.
Found keys: ${color.info(keys.map(k => k.comment).join(', '))}.`)
    }

    await Promise.all(toRemove.map(key => this.heroku.delete(`/account/keys/${key.id}`)))
    ux.action.stop()
  }
}
