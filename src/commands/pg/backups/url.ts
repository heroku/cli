import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import type {BackupTransfer, PublicUrlResponse} from '../../../lib/pg/types.js'

import pgBackupsApi from '../../../lib/pg/backups.js'

export default class Url extends Command {
  static args = {
    backup_id: Args.string({description: 'ID of the backup. If omitted, we use the last backup ID.'}),
  }

  static description = 'get secret but publicly accessible URL of a backup'

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Url)
    const {backup_id} = args
    const {app} = flags

    let num
    if (backup_id) {
      num = await pgBackupsApi(app, this.heroku).num(backup_id)
      if (!num)
        throw new Error(`Invalid Backup: ${backup_id}`)
    } else {
      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: utils.pg.host()})
      const succeededBackups = transfers.filter(t => t.succeeded && t.to_type === 'gof3r')
      succeededBackups.sort((a, b) => a.created_at.localeCompare(b.created_at))
      const lastBackup = succeededBackups.pop()
      if (!lastBackup)
        throw new Error(`No backups on ${color.app(app)}. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
      num = lastBackup.num
    }

    const {body: info} = await this.heroku.post<PublicUrlResponse>(`/client/v11/apps/${app}/transfers/${num}/actions/public-url`, {hostname: utils.pg.host()})
    ux.stdout(info.url + '\n')
  }
}

