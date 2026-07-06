import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core/ux'

import AccountsModule from '../../lib/accounts/accounts.js'
import Git from '../../lib/git/git.js'

export default class Logout extends Command {
  static aliases = ['logout']
  static baseFlags = Command.baseFlagsWithoutPrompt()
  static description = 'clears local login credentials and invalidates API session'
  static promptFlagActive = false

  async run() {
    await this.parse(Logout)

    ux.action.start('Logging out')
    const cachedAccount = await AccountsModule.current(this.heroku)
    await this.heroku.logout()

    const git = new Git()
    try {
      await git.removeCredentialHelper()
      await git.eraseCredentials()
    } catch {
      // ignore
    }

    if (cachedAccount) {
      await AccountsModule.remove(cachedAccount)
    }

    await this.config.runHook('recache', {type: 'logout'})
    ux.action.stop()
  }
}
