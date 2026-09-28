import type {HerokuSDK} from '@heroku/sdk'
import type {TransferInfoByAppResult} from '@heroku/types/data'

import {ux} from '@oclif/core/ux'
import bytes from 'bytes'

type Data = HerokuSDK['data']

export class LogDisplay {
  private readonly logsAlreadyShown = new Set<string>()

  displayLogs(logs: TransferInfoByAppResult['logs'] | undefined) {
    for (const log of (logs ?? [])) {
      if (this.logsAlreadyShown.has(log.created_at + log.message)) {
        continue
      }

      this.logsAlreadyShown.add(log.created_at + log.message)
      ux.stdout(`${log.created_at} ${log.message}`)
    }
  }
}

export function filesize(size: null | number, opts = {}): string {
  if (size === null) return ''
  Object.assign(opts, {
    decimalPlaces: 2,
    fixedDecimals: true,
  })
  return bytes(size, opts) || ''
}

export function name(transfer: TransferInfoByAppResult): string {
  const oldPGBName = transfer.options?.pgbackups_name
  if (oldPGBName) return `o${oldPGBName}`
  return `${prefix(transfer)}${(transfer.num || '').toString().padStart(3, '0')}`
}

export async function num(transferName: string, app: string, data: Data): Promise<number | undefined> {
  let m = transferName.match(/^[abcr](\d+)$/)
  if (m) return Number.parseInt(m[1], 10)
  m = transferName.match(/^o[ab]\d+$/)
  if (m) {
    const transfers = await data.transfer.listByApp(app)
    const transfer = transfers.find(t => name(t) === transferName)
    if (transfer) return transfer.num
  }
}

export function status(transfer: TransferInfoByAppResult): string {
  const {finished_at, processed_bytes, started_at, succeeded, warnings} = transfer
  if (finished_at && succeeded) {
    if (warnings > 0) {
      return `Finished with ${warnings} warnings`
    }

    return `Completed ${finished_at}`
  }

  if (finished_at) {
    return `Failed ${finished_at}`
  }

  if (started_at) {
    return `Running (processed ${filesize(processed_bytes)})`
  }

  return 'Pending'
}

function prefix(transfer: TransferInfoByAppResult) {
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
