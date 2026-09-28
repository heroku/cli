import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import ConfirmCommand from '../../../lib/confirm-command.js'
import * as pgBackups from '../../../lib/pg/backups.js'

export default class Delete extends Command {
  static args = {
    backup_id: Args.string({description: 'ID of the backup', required: true}),
  }
  static description = 'delete a backup'
  static examples = [
    color.command('heroku pg:backup:delete --app APP_ID BACKUP_ID'),
  ]
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c', hidden: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Delete)
    const {app, confirm} = flags
    const {backup_id} = args
    const {data} = new HerokuSDK()

    await new ConfirmCommand().confirm(app, confirm)
    ux.action.start(`Deleting backup ${color.cyan(backup_id)} on ${color.app(app)}`)

    const num = await pgBackups.num(backup_id, app, data)
    if (!num) {
      throw new Error(`Invalid Backup: ${backup_id}`)
    }

    await data.transfer.deleteByApp(app, String(num))
    ux.action.stop()
  }
}
