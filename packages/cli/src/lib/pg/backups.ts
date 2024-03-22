import {APIClient} from '@heroku-cli/command'
import pgHost from './host'
import bytes = require('bytes')

export type BackupTransfer = {
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
  schedule: string,
  started_at: string,
  source_bytes: number,
  succeeded: boolean,
  to_type: string,
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

export default (app: string, heroku: APIClient) => ({
  filesize: (size: any, opts = {}) => {
    Object.assign(opts, {
      decimalPlaces: 2,
      fixedDecimals: true,
    })
    return bytes(size, opts)
  },

  transfer: {
    num: async function (name: string) {
      let m = name.match(/^[abcr](\d+)$/)
      if (m) return Number.parseInt(m[1], 10)
      m = name.match(/^o[ab]\d+$/)
      if (m) {
        const {body: transfers} = await heroku.get<BackupTransfer[]>(`/client/v11/apps/${app}/transfers`, {hostname: pgHost()})
        const transfer = transfers.find(t => this.name(t) === name)
        if (transfer) return transfer.num
      }
    },
    name: (transfer: BackupTransfer) => {
      const oldPGBName = transfer.options && transfer.options.pgbackups_name
      if (oldPGBName) return `o${oldPGBName}`
      return `${prefix(transfer)}${(transfer.num || '').toString().padStart(3, '0')}`
    },
  },
})
