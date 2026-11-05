import type {AddOn} from '@heroku/types/3.sdk'

import {flags as Flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {type ForkResult, postgresExtensions} from '@heroku/sdk/extensions/data'
import {NotAdvancedDatabaseError} from '@heroku/sdk/resources/data/postgres-database'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/base-command.js'
import {parseProvisionOpts} from '../../../lib/data/parse-provision-opts.js'
import provisionInteractively from '../../../lib/data/provision-interactively.js'
import {lazyModuleLoader} from '../../../lib/lazy-module-loader.js'
import notify from '../../../lib/notify.js'
import {createSDK} from '../../../lib/sdk.js'

const heredoc = tsheredoc

export default class Fork extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'fork or rollback a Postgres Advanced database'
  static examples = [
    heredoc`
      # Create a fork for an existing database
      <%= config.bin %> <%= command.id %> DATABASE --app my-app --as DATABASE_COPY
    `,
    heredoc`
      # Create a point-in-time recovery fork with a timestamp:
      <%= config.bin %> <%= command.id %> DATABASE --app my-app --as RESTORED --rollback-to '2025-08-11T12:35:00'
    `,
    heredoc`
      # Create a point-in-time recovery fork with a time interval:
      <%= config.bin %> <%= command.id %> DATABASE --app my-app --as RESTORED --rollback-by '1 day 3 hours 20 minutes'
    `,
  ]
  static flags = {
    app: Flags.app({required: true}),
    as: Flags.string({description: 'name for the initial database attachment'}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    level: Flags.string({description: 'set compute scale'}),
    name: Flags.string({char: 'n', description: 'name for the database'}),
    'provision-option': Flags.string({
      description: 'additional options for provisioning in KEY:VALUE or KEY format, and VALUE defaults to "true" (example: \'foo:bar\' or \'foo\')',
      multiple: true,
    }),
    remote: Flags.remote(),
    'rollback-by': Flags.string({
      description: 'time interval to rollback (example: \'3 days\', \'2 hours\', \'3 days 7 hours 22 minutes\')',
    }),
    'rollback-to': Flags.string({
      description: 'explicit timestamp for rollback database with the format \'2025-11-17T15:20:00\'',
      exclusive: ['rollback-by'],
    }),
    wait: Flags.boolean({description: 'watch database fork creation status and exit when complete'}),
  }

  public async notify(message: string, success = true): Promise<void> {
    notify('heroku data:pg:fork', message, success)
  }

  /**
   * Parses a time interval string for rollback operations.
   * Automatically appends "ago" to make chrono parsing work with simple intervals.
   *
   * @param interval - Time interval like '3 days', '2 hours', or '3 days 7 hours'
   * @returns Date object representing the point in time for recovery
   * @throws Error if interval cannot be parsed
   *
   * @example
   * parseRollbackInterval('3 days')           // 3 days ago
   * parseRollbackInterval('2 days 5 hours')   // 2 days 5 hours ago
   * parseRollbackInterval('1 day ago')        // 1 day ago (doesn't double-add)
   */
  public parseRollbackInterval(interval: string, chrono: any): Date {
    const normalized = interval.trim().toLowerCase()

    const timeString = normalized.endsWith('ago')
      ? interval
      : `${interval} ago`

    const parsedDate = chrono.parseDate(timeString)

    if (!parsedDate) {
      ux.error(`${interval} isn't a supported time interval. Use a format like '1 day', '3 hours', '2 days 5 hours' for example. `
        + 'See https://devcenter.heroku.com/articles/heroku-postgres-rollback.')
    }

    return parsedDate
  }

  public async run(): Promise<ForkResult> {
    const chrono = await lazyModuleLoader.loadChrono()

    const {args, flags} = await this.parse(Fork)
    const {database} = args
    const {app, as, confirm, level, name, 'provision-option': provisionOpts, 'rollback-by': rollbackBy, 'rollback-to': rollbackTo, wait} = flags

    const {data} = createSDK(this.heroku, {extensions: [postgresExtensions]})

    // Parse provision options
    let provisionConfig: Record<string, string> = {}
    if (provisionOpts) {
      try {
        provisionConfig = parseProvisionOpts(provisionOpts)
      } catch (error) {
        ux.error(error instanceof Error ? error.message : String(error))
      }
    }

    // `--rollback-to` is a platform-formatted timestamp passed through verbatim;
    // `--rollback-by` is a CLI-only interval parsed to a Date here, which the SDK
    // formats to the platform's UTC timestamp.
    let recoveryTime: Date | string | undefined
    if (rollbackTo) {
      recoveryTime = rollbackTo
    } else if (rollbackBy) {
      recoveryTime = this.parseRollbackInterval(rollbackBy, chrono)
    }

    const rollbackMessage = `with a rollback ${rollbackTo ? `to ${rollbackTo}` : `by ${rollbackBy}`}`
    // The SDK resolves and tier-checks the source before this spinner should
    // appear, so the message is built from the resolved source name (via the
    // `onResolved` hook) rather than the raw identity the user typed. The
    // raw-identity form is the pre-resolution fallback.
    const buildActionStartMessage = (sourceName: string): string => recoveryTime
      ? `Creating a fork for ${color.addon(sourceName)} on ${color.app(app)} ${rollbackMessage}`
      : `Creating a fork for ${color.addon(sourceName)} on ${color.app(app)}`

    // Builds the classic-command hint from the resolved source the SDK carries
    // on NotAdvancedDatabaseError, so we never resolve the source twice.
    const renderLegacyCommand = (source: AddOn): string => `heroku addons:create ${source.plan?.name}`
        + ` -a ${app}`
        + `${name ? ` --name ${name}` : ''}`
        + `${as ? ` --as ${as}` : ''}`
        + `${wait ? ' --wait' : ''}`
        + ` -- ${rollbackTo || rollbackBy ? '--rollback' : '--fork'} ${source.name}`
        + `${rollbackTo ? ` --to '${rollbackTo}'` : ''}`
        + `${rollbackBy ? ` --by '${rollbackBy}'` : ''}`

    try {
      const result = await provisionInteractively(
        {
          actionStartMessage: buildActionStartMessage(database),
          actionStopMessage: 'done',
          app,
          confirm,
          resolvedActionStartMessage: source => buildActionStartMessage(source.name || database),
          wait: Boolean(wait),
        },
        (confirmValue, hooks) => data.postgres.fork(app, database, {
          as,
          config: provisionConfig,
          confirm: confirmValue,
          level,
          name,
          recoveryTime,
        }, hooks),
      )

      if (wait) {
        this.notify('We successfully provisioned the database fork')
      }

      return result
    } catch (error) {
      if (error instanceof NotAdvancedDatabaseError) {
        ux.error('You can only use this command on Advanced-tier databases.\n'
            + `Use ${color.code(renderLegacyCommand(error.addon as AddOn))} instead.`)
      }

      if (wait) {
        this.notify(
          'We can\'t provision the database fork. Try again or open a ticket with Heroku Support: https://help.heroku.com/.',
          false,
        )
      }

      throw error
    }
  }
}
