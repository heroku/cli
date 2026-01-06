import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import backupsFactory from '../../../lib/pg/backups.js'
import {utils} from '@heroku/heroku-cli-util'
import type {BackupTransfer} from '../../../lib/pg/types.js'

export default class Index extends Command {
  static topic = 'pg'
  static description = 'list database backups'
  static strict = false
  static flags = {
    verbose: flags.boolean({char: 'v', hidden: true}),
    confirm: flags.string({char: 'c', hidden: true}),
    output: flags.string({char: 'o', hidden: true}),
    'wait-interval': flags.string({hidden: true}),
    at: flags.string({hidden: true}),
    quiet: flags.boolean({char: 'q', hidden: true}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags: {app}} = await this.parse(Index)

    const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: utils.pg.host()})
    // NOTE that the sort order is descending
    transfers.sort((transferA, transferB) => transferB.created_at.localeCompare(transferA.created_at))

    this.displayBackups(transfers, app)
    this.displayRestores(transfers, app)
    this.displayCopies(transfers, app)
  }

  private displayBackups(transfers: BackupTransfer[], app: string) {
    const backups = transfers.filter(backupTransfer => backupTransfer.from_type === 'pg_dump' && backupTransfer.to_type === 'gof3r')
    const {name, status, filesize} = backupsFactory(app, this.heroku)
    hux.styledHeader('Backups')
    if (backups.length === 0) {
      ux.stdout(`No backups. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
    } else {
      hux.table<BackupTransfer>(backups, {
        ID: {
          get: (transfer: BackupTransfer) => color.cyan(name(transfer)),
        },
        'Created at': {
          get: (transfer: BackupTransfer) => transfer.created_at,
        },
        Status: {
          get: (transfer: BackupTransfer) => status(transfer),
        },
        Size: {
          get: (transfer: BackupTransfer) => filesize(transfer.processed_bytes),
        },
        Database: {
          get: (transfer: BackupTransfer) => color.green(transfer.from_name) || 'UNKNOWN',
        },
      })
    }

    ux.stdout()
  }

  private displayRestores(transfers: BackupTransfer[], app: string) {
    const restores = transfers
      .filter(t => t.from_type !== 'pg_dump' && t.to_type === 'pg_restore')
      .slice(0, 10) // first 10 only
    const {name, status, filesize} = backupsFactory(app, this.heroku)
    hux.styledHeader('Restores')
    if (restores.length === 0) {
      ux.stdout(`No restores found. Use ${color.cyan.bold('heroku pg:backups:restore')} to restore a backup`)
    } else {
      hux.table(restores, {
        ID: {
          get: (transfer: BackupTransfer) => color.cyan(name(transfer)),
        },
        'Started at': {
          get: (transfer: BackupTransfer) => transfer.created_at,
        },
        Status: {
          get: (transfer: BackupTransfer) => status(transfer),
        },
        Size: {
          get: (transfer: BackupTransfer) => filesize(transfer.processed_bytes),
        },
        Database: {
          get: (transfer: BackupTransfer) => color.green(transfer.to_name) || 'UNKNOWN',
        },
      })
    }

    ux.stdout()
  }

  private displayCopies(transfers: BackupTransfer[], app: string) {
    const {name, status, filesize} = backupsFactory(app, this.heroku)
    const copies = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'pg_restore').slice(0, 10)
    hux.styledHeader('Copies')
    if (copies.length === 0) {
      ux.stdout(`No copies found. Use ${color.cyan.bold('heroku pg:copy')} to copy a database to another`)
    } else {
      hux.table(copies, {
        ID: {
          get: (transfer: BackupTransfer) => color.cyan(name(transfer)),
        },
        'Started at': {
          get: (transfer: BackupTransfer) => transfer.created_at,
        },
        Status: {
          get: (transfer: BackupTransfer) => status(transfer),
        },
        Size: {
          get: (transfer: BackupTransfer) => filesize(transfer.processed_bytes),
        },
        From: {
          get: (transfer: BackupTransfer) => color.green(transfer.from_name) || 'UNKNOWN',
        },
        To: {
          get: (transfer: BackupTransfer) => color.green(transfer.to_name) || 'UNKNOWN',
        },
      })
    }

    ux.stdout()
  }
}
