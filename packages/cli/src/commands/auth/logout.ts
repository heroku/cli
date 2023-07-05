import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'

export default class Logout extends Command {
  static description = 'clears local login credentials and invalidates API session'

  static aliases = ['logout']

  async run() {
    ux.action.start('Logging out')
    await this.heroku.logout()
    await this.config.runHook('recache', {type: 'logout'})
  }
}
