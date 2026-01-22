import {color, hux, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import type {BackupTransfer} from '../../../lib/pg/types.js'

import backupsFactory from '../../../lib/pg/backups.js'

export default class Index extends Command {
  static description = 'list database backups'
  static flags = {
    app: flags.app({required: true}),
    at: flags.string({hidden: true}),
    confirm: flags.string({char: 'c', hidden: true}),
    output: flags.string({char: 'o', hidden: true}),
    quiet: flags.boolean({char: 'q', hidden: true}),
    remote: flags.remote(),
    verbose: flags.boolean({char: 'v', hidden: true}),
    'wait-interval': flags.string({hidden: true}),
  }

  static strict = false
  static topic = 'pg'

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
    const pgbackups = backupsFactory(app, this.heroku)
    hux.styledHeader('Backups')
    if (backups.length === 0) {
      ux.stdout(`No backups. Capture one with ${color.cyan.bold('heroku pg:backups:capture')}`)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table<BackupTransfer>(backups, {
        ID: {
          get: (transfer: BackupTransfer) => color.name(pgbackups.name(transfer)),
        },
        'Created at': {
          get: (transfer: BackupTransfer) => transfer.created_at,
        },
        Status: {
          get: (transfer: BackupTransfer) => pgbackups.status(transfer),
        },
        Size: {
          get: (transfer: BackupTransfer) => pgbackups.filesize(transfer.processed_bytes),
        },
        Database: {
          get: (transfer: BackupTransfer) => color.datastore(transfer.from_name) || 'UNKNOWN',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    }

    ux.stdout()
  }

  private displayCopies(transfers: BackupTransfer[], app: string) {
    const pgbackups = backupsFactory(app, this.heroku)
    const copies = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'pg_restore').slice(0, 10)
    hux.styledHeader('Copies')
    if (copies.length === 0) {
      ux.stdout(`No copies found. Use ${color.cyan.bold('heroku pg:copy')} to copy a database to another`)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(copies, {
        ID: {
          get: (transfer: BackupTransfer) => color.name(pgbackups.name(transfer)),
        },
        'Started at': {
          get: (transfer: BackupTransfer) => transfer.created_at,
        },
        Status: {
          get: (transfer: BackupTransfer) => pgbackups.status(transfer),
        },
        Size: {
          get: (transfer: BackupTransfer) => pgbackups.filesize(transfer.processed_bytes),
        },
        From: {
          get: (transfer: BackupTransfer) => color.datastore(transfer.from_name) || color.inactive('UNKNOWN'),
        },
        To: {
          get: (transfer: BackupTransfer) => color.datastore(transfer.to_name) || color.inactive('UNKNOWN'),
        },
      })
    }
    /* eslint-enable perfectionist/sort-objects */

    ux.stdout()
  }

  private displayRestores(transfers: BackupTransfer[], app: string) {
    const restores = transfers
      .filter(t => t.from_type !== 'pg_dump' && t.to_type === 'pg_restore')
      .slice(0, 10) // first 10 only
    const pgbackups = backupsFactory(app, this.heroku)
    hux.styledHeader('Restores')
    if (restores.length === 0) {
      ux.stdout(`No restores found. Use ${color.cyan.bold('heroku pg:backups:restore')} to restore a backup`)
    } else {
      hux.table(restores, {
        ID: {
          get: (transfer: BackupTransfer) => color.cyan(pgbackups.name(transfer)),
        },
        'Started at': {
          get: (transfer: BackupTransfer) => transfer.created_at,
        },
        Status: {
          get: (transfer: BackupTransfer) => pgbackups.status(transfer),
        },
        Size: {
          get: (transfer: BackupTransfer) => pgbackups.filesize(transfer.processed_bytes),
        },
        Database: {
          get: (transfer: BackupTransfer) => color.green(transfer.to_name) || 'UNKNOWN',
        },
      })
    }

    ux.stdout()
  }
}
