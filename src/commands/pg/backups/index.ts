import type {TransferInfoByAppResult, TransferListByAppResult} from '@heroku/types/data'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

import * as pgBackups from '../../../lib/pg/backups.js'

// hux.table needs Record<string, unknown>; the SDK's interface-based TransferInfoByAppResult has no implicit index signature.
type TransferRow = Record<string, unknown> & TransferInfoByAppResult

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

    const {data} = new HerokuSDK()
    const transfers = await data.transfer.listByApp(app)
    // NOTE that the sort order is descending
    transfers.sort((transferA, transferB) => transferB.created_at.localeCompare(transferA.created_at))

    this.displayBackups(transfers)
    this.displayRestores(transfers)
    this.displayCopies(transfers)
  }

  private displayBackups(transfers: TransferListByAppResult) {
    const backups = transfers.filter(backupTransfer => backupTransfer.from_type === 'pg_dump' && backupTransfer.to_type === 'gof3r')
    hux.styledHeader('Backups')
    if (backups.length === 0) {
      ux.stdout(`No backups. Capture one with ${color.code('heroku pg:backups:capture')}`)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table<TransferRow>(backups as TransferRow[], {
        ID: {
          get: (transfer: TransferInfoByAppResult) => color.name(pgBackups.name(transfer)),
        },
        'Created at': {
          get: (transfer: TransferInfoByAppResult) => transfer.created_at,
        },
        Status: {
          get: (transfer: TransferInfoByAppResult) => pgBackups.status(transfer),
        },
        Size: {
          get: (transfer: TransferInfoByAppResult) => pgBackups.filesize(transfer.processed_bytes),
        },
        Database: {
          get: (transfer: TransferInfoByAppResult) => transfer.from_name ? color.datastore(transfer.from_name) : 'UNKNOWN',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    }

    ux.stdout()
  }

  private displayCopies(transfers: TransferListByAppResult) {
    const copies = transfers.filter(t => t.from_type === 'pg_dump' && t.to_type === 'pg_restore').slice(0, 10)
    hux.styledHeader('Copies')
    if (copies.length === 0) {
      ux.stdout(`No copies found. Use ${color.code('heroku pg:copy')} to copy a database to another`)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table<TransferRow>(copies as TransferRow[], {
        ID: {
          get: (transfer: TransferInfoByAppResult) => color.name(pgBackups.name(transfer)),
        },
        'Started at': {
          get: (transfer: TransferInfoByAppResult) => transfer.created_at,
        },
        Status: {
          get: (transfer: TransferInfoByAppResult) => pgBackups.status(transfer),
        },
        Size: {
          get: (transfer: TransferInfoByAppResult) => pgBackups.filesize(transfer.processed_bytes),
        },
        From: {
          get: (transfer: TransferInfoByAppResult) => transfer.from_name ? color.datastore(transfer.from_name) : color.inactive('UNKNOWN'),
        },
        To: {
          get: (transfer: TransferInfoByAppResult) => transfer.to_name ? color.datastore(transfer.to_name) : color.inactive('UNKNOWN'),
        },
      })
    }
    /* eslint-enable perfectionist/sort-objects */

    ux.stdout()
  }

  private displayRestores(transfers: TransferListByAppResult) {
    const restores = transfers
      .filter(t => t.from_type !== 'pg_dump' && t.to_type === 'pg_restore')
      .slice(0, 10) // first 10 only
    hux.styledHeader('Restores')
    if (restores.length === 0) {
      ux.stdout(`No restores found. Use ${color.code('heroku pg:backups:restore')} to restore a backup`)
    } else {
      /* eslint-disable perfectionist/sort-objects */
      hux.table<TransferRow>(restores as TransferRow[], {
        ID: {
          get: (transfer: TransferInfoByAppResult) => color.name(pgBackups.name(transfer)),
        },
        'Started at': {
          get: (transfer: TransferInfoByAppResult) => transfer.created_at,
        },
        Status: {
          get: (transfer: TransferInfoByAppResult) => pgBackups.status(transfer),
        },
        Size: {
          get: (transfer: TransferInfoByAppResult) => pgBackups.filesize(transfer.processed_bytes),
        },
        Database: {
          get: (transfer: TransferInfoByAppResult) => transfer.to_name ? color.datastore(transfer.to_name) : 'UNKNOWN',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    }

    ux.stdout()
  }
}
