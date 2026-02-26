import {Command} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export default class Clear extends Command {
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'remove all SSH keys for current user'
  static promptFlagActive = false

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
