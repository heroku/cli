import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import * as pgBackups from '../../../lib/pg/backups.js'

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
    const {data} = new HerokuSDK()

    let num
    if (backup_id) {
      num = await pgBackups.num(backup_id, app, data)
      if (!num)
        throw new Error(`Invalid Backup: ${backup_id}`)
    } else {
      const transfers = await data.transfer.listByApp(app)
      const succeededBackups = transfers.filter(t => t.succeeded && t.to_type === 'gof3r')
      succeededBackups.sort((a, b) => a.created_at.localeCompare(b.created_at))
      const lastBackup = succeededBackups.pop()
      if (!lastBackup)
        throw new Error(`No backups on ${color.app(app)}. Capture one with ${color.code('heroku pg:backups:capture')}`)
      num = lastBackup.num
    }

    const info = await data.transfer.publicUrl(app, String(num), {})
    ux.stdout(info.url + '\n')
  }
}
