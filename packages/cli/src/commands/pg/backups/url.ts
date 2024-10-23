import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import host from '../../../lib/pg/host'
import pgBackupsApi from '../../../lib/pg/backups'
import {sortBy} from 'lodash'
import type {BackupTransfer, PublicUrlResponse} from '../../../lib/pg/types'

export default class Url extends Command {
    static topic = 'pg';
    static description = 'get secret but publicly accessible URL of a backup';
    static flags = {
      app: flags.app({required: true}),
      remote: flags.remote(),
    };

    static args = {
      backup_id: Args.string({description: 'ID of the backup to get the secret but publicly accessible URL for. If omitted, we use the last backup ID.'}),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Url)
      const {backup_id} = args
      const {app} = flags

      let num
      if (backup_id) {
        num = await pgBackupsApi(app, this.heroku).num(backup_id)
        if (!num)
          throw new Error(`Invalid Backup: ${backup_id}`)
      } else {
        const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: host()})
        const lastBackup = sortBy(transfers.filter(t => t.succeeded && t.to_type === 'gof3r'), 'created_at')
          .pop()
        if (!lastBackup)
          throw new Error(`No backups on ${color.app(app)}. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
        num = lastBackup.num
      }

      const {body: info} = await this.heroku.post<PublicUrlResponse>(`/client/v11/apps/${app}/transfers/${num}/actions/public-url`, {hostname: host()})
      ux.log(info.url)
    }
}
