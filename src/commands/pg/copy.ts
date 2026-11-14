import type {DatabaseCopyEndpoint, DatabaseCopyOptions, DatabaseCopyResult} from '@heroku/sdk/extensions/data'
import type {TransferCreateResult} from '@heroku/types/data'

import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {databaseCopyExtensions, TransferFailedError} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import * as pgBackups from '../../lib/pg/backups.js'
import {createSDK} from '../../lib/sdk.js'

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
    const {data} = createSDK(heroku, {extensions: [databaseCopyExtensions]})
    const waitOptions = pgBackups.constructWaitOptions(interval, verbose, () => 'Copying')
    let result: DatabaseCopyResult
    let copyTransfer: TransferCreateResult | undefined
    let hasAdditionalCredentials = false
    let actionStarted = false
    let additionalCredentialsWarningShown = false
    const warningsShown = new Set<string>()

    const warnOnce = (warning: string) => {
      if (warningsShown.has(warning)) return
      ux.warn(warning)
      warningsShown.add(warning)
    }

    const warnAboutAdditionalCredentials = () => {
      if (hasAdditionalCredentials && !additionalCredentialsWarningShown) {
        warnOnce('pg:copy will only copy your default credential and the data it has access to. Any additional credentials and data that only they can access will not be copied.')
        additionalCredentialsWarningShown = true
      }
    }

    try {
      // copyForApp is the public SDK API; keep a local shape for older installed SDK declarations.
      const database = data.database as unknown as {
        copyForApp: (app: string, source: string, target: string, options: DatabaseCopyOptions) => Promise<DatabaseCopyResult>
      }
      result = await database.copyForApp(app, args.source, args.target, {
        async beforeCopy({source, target}) {
          const message = 'WARNING: Destructive action\n'
            + `This command will remove all data from ${color.yellow(target.name)}\n`
            + `Data from ${color.yellow(source.name)} will then be transferred to ${color.yellow(target.name)}`
          await hux.confirmCommand({comparison: target.confirm, confirmation: confirm, warningMessage: message})
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
              // waitPoller.onStart runs first and populates copyTransfer before this restart.
              waitOptions.waitPoller?.onStart?.(copyTransfer)
              actionStarted = true
            }
          },
        },
        credentialToken: heroku.auth,
        onCredentialsChecked({hasAdditionalCredentials: hasAdditionalCredentialsFound, warning}: {
          credentialCount?: number
          hasAdditionalCredentials: boolean
          warning?: string
        }) {
          hasAdditionalCredentials ||= hasAdditionalCredentialsFound
          warnAboutAdditionalCredentials()
          if (warning) warnOnce(warning)
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

      if (error instanceof TransferFailedError) {
        pgBackups.reportTransferFailure(error, 'copy', warningsShown)
      }

      if (actionStarted) ux.action.stop('!')
      throw error
    }

    hasAdditionalCredentials ||= result.hasAdditionalCredentials
    warnAboutAdditionalCredentials()

    for (const warning of result.warnings) warnOnce(warning)
    return result
  }
}
