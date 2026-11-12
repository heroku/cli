import type {DatabaseCopyEndpoint, DatabaseCopyResult} from '@heroku/sdk/extensions/data'
import type {TransferCreateResult} from '@heroku/types/data'

import {
  ALLOWED_HEROKU_DOMAINS, Command, flags, LOCALHOST_DOMAINS,
} from '@heroku-cli/command'
import {color, utils} from '@heroku/heroku-cli-util'
import {databaseCopyExtensions, TransferFailedError} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import ConfirmCommand from '../../lib/confirm-command.js'
import * as pgBackups from '../../lib/pg/backups.js'
import {createSDK} from '../../lib/sdk.js'

const heredoc = tsheredoc

function dataApiBaseUrl(): string {
  const configuredHost = utils.pg.host()
  if (/[?#]/.test(configuredHost)) {
    throw new Error('Invalid data API host')
  }

  let url: URL
  try {
    url = new URL(configuredHost.includes('://') ? configuredHost : `https://${configuredHost}`)
  } catch {
    throw new Error('Invalid data API host')
  }

  const isLocalhost = LOCALHOST_DOMAINS.includes(url.hostname as (typeof LOCALHOST_DOMAINS)[number])
  const trustedHost = ALLOWED_HEROKU_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    || isLocalhost

  if (!trustedHost || (isLocalhost ? !['http:', 'https:'].includes(url.protocol) : url.protocol !== 'https:')) {
    throw new Error('Refusing to send Heroku credentials to untrusted data API host')
  }

  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Invalid data API host')
  }

  return url.origin
}

function rawUrlConfirmationValue(identity: string): string | undefined {
  if (!/^postgres:\/\//.test(identity)) return undefined
  const url = new URL(identity)
  return url.pathname.slice(1) || url.hostname
}

function showCopyFailure(error: TransferFailedError): never {
  ux.action.stop('!')
  for (const warning of error.ancillaryErrors ?? []) ux.warn(warning)

  ux.error(new Error(heredoc(`
    An error occurred and the backup did not finish.

    ${(error.transfer.logs || []).slice(-5).map(log => log.message).join('\n')}

    Run ${color.code(`heroku pg:backups:info ${pgBackups.name(error.transfer)}`)} for more details.`)))
}

export default class Copy extends Command {
  static args = {
    source: Args.string({description: 'config var exposed to the owning app containing the source database URL', required: true}),
    target: Args.string({description: 'config var exposed to the owning app containing the target database URL', required: true}),
  }
  static description = 'copy all data from source db to target'
  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string(),
    remote: flags.remote(),
    verbose: flags.boolean(),
    'wait-interval': flags.string(),
  }
  static help = 'at least one of the databases must be a Heroku PostgreSQL DB'
  static topic = 'pg'

  public async run(): Promise<DatabaseCopyResult> {
    const {args, flags: commandFlags} = await this.parse(Copy)
    const {app, confirm, verbose, 'wait-interval': waitInterval} = commandFlags
    const {heroku} = this
    const interval = Math.max(3, Number.parseInt(waitInterval || '0', 10)) || 3
    const {data} = createSDK(heroku, {
      clientOptionsByService: {data: {baseUrl: dataApiBaseUrl()}},
      extensions: [databaseCopyExtensions],
    })
    const waitOptions = pgBackups.constructWaitOptions(interval, verbose, () => 'Copying')
    let result: DatabaseCopyResult
    let copyTransfer: TransferCreateResult | undefined
    let hasAdditionalCredentials = false
    let actionStarted = false
    let additionalCredentialsWarningShown = false

    const warnAboutAdditionalCredentials = () => {
      if (hasAdditionalCredentials && !additionalCredentialsWarningShown) {
        ux.warn('pg:copy will only copy your default credential and the data it has access to. Any additional credentials and data that only they can access will not be copied.')
        additionalCredentialsWarningShown = true
      }
    }

    try {
      result = await data.database.copy(app, args.source, args.target, {
        async beforeCopy({source, target}) {
          const targetConfirm = rawUrlConfirmationValue(args.target) ?? target.confirm
          const message = `WARNING: Destructive action\nThis command will remove all data from ${color.yellow(target.name)}\n`
            + `Data from ${color.yellow(source.name)} will then be transferred to ${color.yellow(target.name)}`
          await new ConfirmCommand().confirm(targetConfirm, confirm, message)

          if (source.database) {
            try {
              const {data: credentialsData} = createSDK(heroku, {
                clientOptionsByService: {
                  data: {
                    baseUrl: dataApiBaseUrl(),
                    headers: {Authorization: `Basic ${Buffer.from(`:${heroku.auth}`).toString('base64')}`},
                    token: () => '',
                  },
                },
              })
              const credentials = await credentialsData.postgresDatabase.listCredentials(source.database.addon.name)
              hasAdditionalCredentials ||= Array.isArray(credentials) && credentials.length > 1
              warnAboutAdditionalCredentials()
            } catch {
              // Credential lookup is advisory; the SDK's later lookup remains a fallback.
            }
          }
        },
        copyPoller: {
          onStart({source, target}: {source: DatabaseCopyEndpoint; target: DatabaseCopyEndpoint}) {
            ux.action.start(`Starting copy of ${color.yellow(source.name)} to ${color.yellow(target.name)}`)
            actionStarted = true
          },
          onStop() {
            ux.action.stop()
            actionStarted = false
            if (copyTransfer) {
              waitOptions.waitPoller?.onStart?.(copyTransfer)
              actionStarted = true
            }
          },
        },
        credentialToken: heroku.auth,
        onCredentialsChecked({hasAdditionalCredentials: hasAdditionalCredentialsFound}) {
          hasAdditionalCredentials ||= hasAdditionalCredentialsFound
          warnAboutAdditionalCredentials()
        },
        verbose,
        ...waitOptions,
        waitPoller: {
          ...waitOptions.waitPoller,
          onStart(transfer) {
            copyTransfer = transfer
          },
          onStop(transfer) {
            waitOptions.waitPoller?.onStop?.(transfer)
            actionStarted = false
          },
        },
      })
    } catch (error) {
      warnAboutAdditionalCredentials()

      if (error instanceof TransferFailedError) return showCopyFailure(error)
      if (actionStarted) ux.action.stop('!')
      throw error
    }

    hasAdditionalCredentials ||= result.hasAdditionalCredentials
    warnAboutAdditionalCredentials()

    for (const warning of result.warnings) ux.warn(warning)
    return result
  }
}
