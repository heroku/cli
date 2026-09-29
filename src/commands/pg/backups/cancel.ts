import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import * as pgBackups from '../../../lib/pg/backups.js'

export default class Cancel extends Command {
  static args = {
    backup_id: Args.string({description: 'ID of the backup. If omitted, we use the last unfinished backup ID.'}),
  }
  static description = 'cancel an in-progress backup or restore (default newest)'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Cancel)
    const {app} = flags
    const {backup_id} = args
    const {data} = new HerokuSDK()

    let transfer

    if (backup_id) {
      const num = await pgBackups.num(backup_id, app, data)
      if (!num) {
        ux.error(`Invalid Backup: ${backup_id}`)
      }

      transfer = await data.transfer.infoByApp(app, String(num), {})
    } else {
      const transfers = await data.transfer.listByApp(app)
      transfer = transfers
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .find(t => !t.finished_at)
    }

    if (transfer) {
      ux.action.start(`Cancelling ${pgBackups.name(transfer)}`)
      await data.transfer.cancel(app, transfer.uuid)
      ux.action.stop()
    } else {
      ux.error('No active backups/transfers')
    }
  }
}
