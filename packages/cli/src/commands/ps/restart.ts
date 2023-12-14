import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import color from '@heroku-cli/color'
import {ux} from '@oclif/core'
import {Notifications} from '../../lib/types/notifications'
import * as time from '../../lib/notifications/time'
import * as wrap from 'word-wrap'

export default class Restart extends Command {
  static description = 'display notifications'
  static topic = 'notifications'

  static flags = {
    app: flags.app({required: false}),
    all: flags.boolean({description: 'view all notifications (not just the ones for the current app)'}),
    json: flags.boolean({description: 'output in json format'}),
    read: flags.boolean({description: 'show notifications already read'}),
  }

  async run() {
    const {flags} = await this.parse(Restart)
    //
  }
}
