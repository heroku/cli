import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import backupsFactory from '../../../lib/pg/backups'
import host from '../../../lib/pg/host'
import type {BackupTransfer} from '../../../lib/pg/types'

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

    const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: host()})
    // NOTE that the sort order is descending
    transfers.sort((transferA, transferB) => {
      if (transferA.created_at > transferB.created_at) {
        return -1
      }

      if (transferB.created_at > transferA.created_at) {
        return 1
      }

      return 0
    })

    this.displayBackups(transfers, app)
    this.displayRestores(transfers, app)
    this.displayCopies(transfers, app)
  }

  private displayBackups(transfers: BackupTransfer[], app: string) {
    const backups = transfers.filter(backupTransfer => backupTransfer.from_type === 'pg_dump' && backupTransfer.to_type === 'gof3r')
    const {name, status, filesize} = backupsFactory(app, this.heroku)
    ux.styledHeader('Backups')
    if (backups.length === 0) {
      ux.log(`No backups. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
    } else {
      ux.table<BackupTransfer>(backups, {
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

    ux.log()
  }

  private displayRestores(transfers: BackupTransfer[], app: string) {
    const restores = transfers
      .filter(t => t.from_type !== 'pg_dump' && t.to_type === 'pg_restore')
      .slice(0, 10) // first 10 only
    const {name, status, filesize} = backupsFactory(app, this.heroku)
    ux.styledHeader('Restores')
    if (restores.length === 0) {
      ux.log(`No restores found. Use ${color.cyan.bold('heroku pg:backups:restore')} to restore a backup`)
    } else {
      ux.table(restores, {
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

    ux.log()
  }

  private displayCopies(transfers: BackupTransfer[], app: string) {
    const {name, status, filesize} = backupsFactory(app, this.heroku)
    const copies = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'pg_restore').slice(0, 10)
    ux.styledHeader('Copies')
    if (copies.length === 0) {
      ux.log(`No copies found. Use ${color.cyan.bold('heroku pg:copy')} to copy a database to another`)
    } else {
      ux.table(copies, {
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

    ux.log()
  }
}

