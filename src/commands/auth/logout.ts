
import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'

export default class Logout extends Command {
  static aliases = ['logout']
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'clears local login credentials and invalidates API session'
  static promptFlagActive = false

  async run() {
    this.parse(Logout)

    ux.action.start('Logging out')
    await this.heroku.logout()
    await this.config.runHook('recache', {type: 'logout'})
    ux.action.stop()
  }
}
