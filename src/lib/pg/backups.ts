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

// TODO: Temporary default export so pg:backups:capture, pg:backups:restore, and pg:copy still compile. Remove it when those commands move to @heroku/sdk.
import {APIClient} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import tsheredoc from 'tsheredoc'

import type {BackupTransfer} from './types.js'

const heredoc = tsheredoc.default

export default function backupsFactory(app: string, heroku: APIClient) {
  const logs = new LogDisplay()

  async function * poll(transferID: string, interval: number, verbose: boolean, appId: string) {
    const tty = process.env.TERM !== 'dumb' && process.stderr.isTTY
    let backup = {} as BackupTransfer
    let failures = 0

    const quietUrl = `/client/v11/apps/${appId}/transfers/${transferID}`
    const verboseUrl = quietUrl + '?verbose=true'
    const url = verbose ? verboseUrl : quietUrl

    while (failures < 21) {
      try {
        ({body: backup} = await heroku.get<BackupTransfer>(url, {hostname: utils.pg.host()}))
      } catch (error) {
        if (failures++ > 20) throw error
      }

      if (verbose) {
        logs.displayLogs(backup.logs as TransferInfoByAppResult['logs'])
      } else if (tty) {
        const msg = backup.started_at ? filesize(backup.processed_bytes) : 'pending'
        const log = backup.logs?.pop()
        ux.action.status = log ? `${msg}\n${log.created_at} ${log.message}` : msg
      }

      if (backup?.finished_at) {
        if (backup.succeeded) {
          yield true
          break
        }

        ({body: backup} = await heroku.get<BackupTransfer>(verboseUrl, {hostname: utils.pg.host()}))

        throw new Error(heredoc(`
          An error occurred and the backup did not finish.

          ${backup.logs.slice(-5).map(l => l.message).join('\n')}

          Run ${color.code('heroku pg:backups:info ' + name(backup as unknown as TransferInfoByAppResult))} for more details.`))
      }

      yield new Promise(resolve => {
        setTimeout(resolve, interval * 1000)
      })
    }
  }

  return {
    name(transfer: BackupTransfer) {
      return name(transfer as unknown as TransferInfoByAppResult)
    },

    async wait(action: string, transferID: string, interval: number, verbose: boolean, appId: string) {
      if (verbose) ux.stdout(`${action}...`)

      ux.action.start(action)
      try {
        for await (const backupSucceeded of poll(transferID, interval, verbose, appId || app)) {
          if (backupSucceeded) {
            ux.action.stop()
            break
          }
        }
      } catch (error) {
        ux.action.stop('!')
        ux.error(error as Error)
      }
    },
  }
}
