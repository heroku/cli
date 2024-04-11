import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import host from '../../../lib/pg/host'
import backupsFactory from '../../../lib/pg/backups'
import {BackupTransfer} from '../../../lib/pg/types'

export default class Cancel extends Command {
  static topic = 'pg'
  static description = 'cancel an in-progress backup or restore (default newest)'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    backup_id: Args.string(),
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

      ({body: transfer} = await this.heroku.get<BackupTransfer>(`/client/v11/apps/${app}/transfers/${num}`, {hostname: host()}))
    } else {
      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: host()})
      transfer = this.sortByCreatedAtDesc(transfers).find(t => !t.finished_at)
    }

    if (transfer) {
      ux.action.start(`Cancelling ${pgbackups.name(transfer)}`)
      this.heroku.post(`/client/v11/apps/${app}/transfers/${transfer.uuid}/actions/cancel`, {hostname: host()})
      ux.action.stop()
    } else {
      ux.error('No active backups/transfers')
    }
  }

  protected sortByCreatedAtDesc(transfers: BackupTransfer[]): BackupTransfer[] {
    return transfers.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }
}
