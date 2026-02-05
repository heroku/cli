import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {utils} from '@heroku/heroku-cli-util'
import backupsFactory from '../../../lib/pg/backups.js'
import {BackupTransfer} from '../../../lib/pg/types.js'

export default class Cancel extends Command {
  static topic = 'pg'
  static description = 'cancel an in-progress backup or restore (default newest)'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    backup_id: Args.string({description: 'ID of the backup. If omitted, we use the last unfinished backup ID.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Cancel)
    const {app} = flags
    const {backup_id} = args
    const pgbackups = backupsFactory(app, this.heroku)

    let transfer: BackupTransfer | undefined

    if (backup_id) {
      const num = await pgbackups.num(backup_id)
      if (!num) {
        ux.error(`Invalid Backup: ${backup_id}`)
      }

      ({body: transfer} = await this.heroku.get<BackupTransfer>(`/client/v11/apps/${app}/transfers/${num}`, {hostname: utils.pg.host()}))
    } else {
      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: utils.pg.host()})
      transfer = transfers
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .find(t => !t.finished_at)
    }

    if (transfer) {
      ux.action.start(`Cancelling ${pgbackups.name(transfer)}`)
      await this.heroku.post(`/client/v11/apps/${app}/transfers/${transfer.uuid}/actions/cancel`, {hostname: utils.pg.host()})
      ux.action.stop()
    } else {
      ux.error('No active backups/transfers')
    }
  }
}
