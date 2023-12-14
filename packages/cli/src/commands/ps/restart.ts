import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {Args, ux} from '@oclif/core'
import {Notifications} from '../../lib/types/notifications'
import * as time from '../../lib/notifications/time'
import * as wrap from 'word-wrap'

export default class Restart extends Command {
  static description = 'restart app dynos'
  static topic = 'ps'
  static aliases = ['restart', 'dyno:restart']

  static examples = [
    '$ heroku ps:restart web.1',
    '$ heroku ps:restart web',
    '$ heroku ps:restart',
  ]

  static help = 'if DYNO is not specified, restarts all dynos on app'

  static args = {
    dyno: Args.string({required: false}),
  }

  static flags = {
    app: flags.app({required: true}),
  }

  async run() {
    const {flags} = await this.parse(Restart)
    //
  }
}
