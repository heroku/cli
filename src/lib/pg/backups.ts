import type {HerokuSDK} from '@heroku/sdk'
import type {
  CaptureAndWaitOptions, RestoreAndWaitOptions, TransferFailedError, WaitForTransferOptions,
} from '@heroku/sdk/extensions/data'
import type {TransferInfoByAppResult} from '@heroku/types/data'

import {color} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'
import bytes from 'bytes'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc

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

type TransferWaitOptions
  = Pick<CaptureAndWaitOptions | RestoreAndWaitOptions, 'waitPoller'>
  & Pick<WaitForTransferOptions, 'intervalMs' | 'onPoll'>

/**
 * Wait-phase options for `captureAndWait` and `restoreAndWait`.
 * Spread the result into the SDK call.
 */
export function constructWaitOptions(
  interval: number,
  verbose: boolean | undefined,
  action: (transfer: TransferInfoByAppResult) => string,
): TransferWaitOptions {
  const logs = new LogDisplay()
  const tty = process.env.TERM !== 'dumb' && Boolean(process.stderr.isTTY)

  return {
    intervalMs: interval * 1000,
    onPoll(transfer) {
      if (verbose) {
        logs.displayLogs(transfer?.logs)
      } else if (tty) {
        const msg = transfer?.started_at ? filesize(transfer.processed_bytes) : 'pending'
        const log = transfer?.logs?.pop()
        ux.action.status = log ? `${msg}\n${log.created_at + ' ' + log.message}` : msg
      }
    },
    waitPoller: {
      onStart(transfer) {
        const label = action(transfer)
        if (verbose) {
          ux.stdout(`${label}...`)
        }

        ux.action.start(label)
      },
      onStop: () => ux.action.stop(),
    },
  }
}

export function reportTransferFailure(
  error: TransferFailedError,
  transferType: 'backup' | 'copy' | 'restore',
  warningsShown = new Set<string>(),
): never {
  ux.action.stop('!')

  const {transfer} = error
  for (const warning of error.ancillaryErrors ?? []) {
    if (warningsShown.has(warning)) continue
    ux.warn(warning)
    warningsShown.add(warning)
  }

  ux.error(new Error(heredoc(`
    An error occurred and the ${transferType} did not finish.

    ${(transfer.logs || []).slice(-5).map(l => l.message).join('\n')}

    Run ${color.code('heroku pg:backups:info ' + name(transfer))} for more details.`)))
}
