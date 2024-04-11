import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import confirm from '../../../lib/confirm'
import host from '../../../lib/pg/host'
import backupsFactory from '../../../lib/pg/backups'

export default class Delete extends Command {
  static topic = 'pg'
  static description = 'delete a backup'
  static flags = {
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    backup_id: Args.string({required: true}),
  }

  static examples = [
    '$ heroku pg:backup:delete --app APP_ID BACKUP_ID',
  ]

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Delete)
    const {app, confirm} = flags
    const {backup_id} = args
    const pgbackups = backupsFactory(app, this.heroku)

    await confirm(app, confirm)
    ux.action.start(`Deleting backup ${color.cyan(backup_id)} on ${color.app(app)}`)

    const num = await pgbackups.num(backup_id)
    if (!num) {
      throw new Error(`Invalid Backup: ${backup_id}`)
    }

    await this.heroku.delete(`/client/v11/apps/${app}/transfers/${num}`, {hostname: host()})
    ux.action.stop()
  }
}
