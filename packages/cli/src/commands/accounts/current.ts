import {Command} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {current} from '../../lib/accounts/accounts'

export default class Current extends Command {
  static description = 'display the current Heroku account'

  static example = 'heroku accounts:current'

  async run() {
    const account = current()
    if (account) {
      ux.styledHeader(`Current account is ${account}`)
    } else {
      ux.error('No account currently set')
    }
  }
}
