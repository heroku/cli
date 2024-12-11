import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {Command} from '@heroku-cli/command'

export default class Clear extends Command {
  static description = 'remove all SSH keys for current user'
  async run() {
    await this.parse(Clear)

    ux.action.start('Removing all SSH keys')
    const {body: keys} = await this.heroku.get<Heroku.Key[]>('/account/keys')
    await Promise.all(keys.map(key => this.heroku.delete(`/account/keys/${key.id}`, {
      path: `/account/keys/${key.id}`,
    })))
    ux.action.stop()
  }
}

