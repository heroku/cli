import {APIClient} from '@heroku-cli/command'
import pgHost from './host'
import bytes = require('bytes')

export type BackupTransfer = {
  created_at: string,
  canceled_at: string,
  finished_at: string,
  from_name: string,
  from_type: string,
  logs: Array<{
    created_at: string,
    message: string,
  }>,
  num: number,
  options: {
    pgbackups_name: string,
  },
  processed_bytes: number,
  schedule: {uuid: string},
  started_at: string,
  source_bytes: number,
  succeeded: boolean,
  to_name: string,
  to_type: string,
  updated_at: string,
  warnings: number,
}

export type PublicUrlResponse = {
  url: string,
}

function prefix(transfer: BackupTransfer) {
  if (transfer.from_type === 'pg_dump') {
    if (transfer.to_type === 'pg_restore') {
      return 'c'
    }

    return transfer.schedule ? 'a' : 'b'

    // eslint-disable-next-line no-else-return
  } else {
    if (transfer.to_type === 'pg_restore') {
      return 'r'
    }

    return 'b'
  }
}

function filesize(size: number, opts = {}): string {
  Object.assign(opts, {
    decimalPlaces: 2,
    fixedDecimals: true,
  })
  return bytes(size, opts)
}

export default (app: string, heroku: APIClient) => ({
  filesize,
  transfer: {
    status(transfer: BackupTransfer): string {
      if (transfer.finished_at && transfer.succeeded) {
        const warnings = transfer.warnings
        if (warnings > 0) {
          return `Finished with ${warnings} warnings`
        }

        return `Completed ${transfer.finished_at}`
      }

      if (transfer.finished_at) {
        return `Failed ${transfer.finished_at}`
      }

      if (transfer.started_at) {
        return `Running (processed ${filesize(transfer.processed_bytes)})`
      }

      return 'Pending'
    },

    async num(name: string) {
      let m = name.match(/^[abcr](\d+)$/)
      if (m) return Number.parseInt(m[1], 10)
      m = name.match(/^o[ab]\d+$/)
      if (m) {
        const {body: transfers} = await heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: pgHost()})
        const transfer = transfers.find(t => this.name(t) === name)
        if (transfer) return transfer.num
      }
    },

    name(transfer: BackupTransfer) {
      const oldPGBName = transfer.options && transfer.options.pgbackups_name
      if (oldPGBName) return `o${oldPGBName}`
      return `${prefix(transfer)}${(transfer.num || '').toString().padStart(3, '0')}`
    },
  },
})
