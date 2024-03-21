import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import pgHost from '../../../lib/pg/host'
import pgBackupsApi, {BackupTransfer, PublicUrlResponse} from '../../../lib/pg/backups'
import {sortBy} from 'lodash'
import download from '../../../lib/pg/download'
import * as fs from 'fs-extra'

function defaultFilename() {
  let f = 'latest.dump'
  if (!fs.existsSync(f))
    return f
  let i = 1
  do
    f = `latest.dump.${i++}`
  while (fs.existsSync(f))
  return f
}

export default class Download extends Command {
  static topic = 'pg';
  static description = 'downloads database backup';
  static flags = {
    output: flags.string({char: 'o', description: 'location to download to. Defaults to latest.dump'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    backup_id: Args.string(),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Download)
    const {backup_id} = args
    const {app} = flags
    const output = flags.output || defaultFilename()
    let num
    ux.action.start(`Getting backup from ${color.magenta(app)}`)
    if (backup_id) {
      num = await pgBackupsApi(app, this.heroku).transfer.num(backup_id)
      if (!num)
        throw new Error(`Invalid Backup: ${backup_id}`)
    } else {
      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: pgHost()})
      const lastBackup = sortBy(transfers.filter(t => t.succeeded && t.to_type === 'gof3r'), 'created_at')
        .pop()
      if (!lastBackup)
        throw new Error(`No backups on ${color.magenta(app)}. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
      num = lastBackup.num
    }

    ux.action.stop()
    ux.action.start(`fetching url of #${num}`)
    const {body: info} = await this.heroku.post<PublicUrlResponse>(`/client/v11/apps/${app}/transfers/${num}/actions/public-url`, {hostname: pgHost()})

    ux.action.stop(`done, #${num}`)
    await download(info.url, output, {progress: true})
  }
}
