import color from '@heroku-cli/color'
import {APIClient} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import host from './host'
import type {BackupTransfer} from './types'
import bytes = require('bytes')

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

class Backups {
  protected app: string
  protected heroku: APIClient
  protected logsAlreadyShown = new Set<string>()

  constructor(app: string, heroku: APIClient) {
    this.app = app
    this.heroku = heroku
  }

  public filesize(size: number, opts = {}): string {
    Object.assign(opts, {
      decimalPlaces: 2,
      fixedDecimals: true,
    })
    return bytes(size, opts)
  }

  public status = (transfer: BackupTransfer): string => {
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
      return `Running (processed ${this.filesize(transfer.processed_bytes)})`
    }

    return 'Pending'
  }

  public num = async (name: string) => {
    let m = name.match(/^[abcr](\d+)$/)
    if (m) return Number.parseInt(m[1], 10)
    m = name.match(/^o[ab]\d+$/)
    if (m) {
      const {body: transfers} = await this.heroku.get<BackupTransfer[]>(`/client/v11/apps/${this.app}/transfers`, {hostname: host()})
      const transfer = transfers.find(t => this.name(t) === name)
      if (transfer) return transfer.num
    }
  }

  public name = (transfer: BackupTransfer) => {
    const oldPGBName = transfer.options && transfer.options.pgbackups_name
    if (oldPGBName) return `o${oldPGBName}`
    return `${prefix(transfer)}${(transfer.num || '').toString().padStart(3, '0')}`
  }

  // eslint-disable-next-line max-params
  public wait = async (action: string, transferID: string, interval: number, verbose: boolean, app: string | undefined) => {
    if (verbose) {
      ux.log(`${action}...`)
    }

    ux.action.start(action)
    for await (const backupSucceeded of this.poll(transferID, interval, verbose, app || this.app)) {
      if (backupSucceeded) {
        break
      }
    }

    ux.action.stop()
  }

  protected displayLogs(logs: BackupTransfer['logs']) {
    for (const log of logs) {
      if (this.logsAlreadyShown.has(log.created_at + log.message)) {
        continue
      }

      this.logsAlreadyShown.add(log.created_at + log.message)
      ux.log(`${log.created_at} ${log.message}`)
    }
  }

  protected async * poll(transferID: string, interval: number, verbose: boolean, appId: string) {
    const tty = process.env.TERM !== 'dumb' && process.stderr.isTTY
    let backup: BackupTransfer = {} as BackupTransfer
    let failures = 0

    const quietUrl = `/client/v11/apps/${appId ?? this.app}/transfers/${transferID}`
    const verboseUrl = quietUrl + '?verbose=true'

    const url = verbose ? verboseUrl : quietUrl

    while (failures < 21) {
      try {
        ({body: backup} = await this.heroku.get<BackupTransfer>(url, {hostname: host()}))
      } catch (error) {
        if (failures++ > 20) {
          throw error
        }
      }

      if (verbose) {
        this.displayLogs(backup.logs)
      } else if (tty) {
        const msg = backup.started_at ? this.filesize(backup.processed_bytes) : 'pending'
        const log = backup.logs?.pop()
        if (log) {
          ux.action.status = `${msg}\n${log.created_at + ' ' + log.message}`
        } else {
          ux.action.status = msg
        }

        ux.flush()
      }

      if (backup?.finished_at) {
        if (backup.succeeded) {
          yield true
          break
        }

        // logs is undefined unless verbose=true is passed
        ({body: backup} = await this.heroku.get<BackupTransfer>(verboseUrl, {hostname: host()}))

        ux.error(heredoc(`
          An error occurred and the backup did not finish.

          ${backup.logs.slice(-5).map(l => l.message).join('\n')}

          Run ${color.cmd('heroku pg:backups:info ' + this.name(backup))} for more details.`))
      }

      yield new Promise(resolve => {
        setTimeout(resolve, interval * 1000)
      })
    }
  }
}

function factory(app: string, heroku: APIClient) {
  return new Backups(app, heroku)
}

export default factory
