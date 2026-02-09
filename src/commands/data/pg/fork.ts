import {color, utils} from '@heroku/heroku-cli-util'
import {flags as Flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as chrono from 'chrono-node'
import tsheredoc from 'tsheredoc'

import createAddon from '../../../lib/addons/create_addon.js'
import BaseCommand from '../../../lib/data/baseCommand.js'
import {parseProvisionOpts} from '../../../lib/data/parseProvisionOpts.js'
import {InfoResponse} from '../../../lib/data/types.js'
import notify from '../../../lib/notify.js'

const heredoc = tsheredoc.default

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
    confirm: Flags.string({hidden: true}),
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
  public parseRollbackInterval(interval: string): Date {
    const normalized = interval.trim().toLowerCase()

    const timeString = normalized.endsWith('ago')
      ? interval
      : `${interval} ago`

    const parsedDate = chrono.parseDate(timeString)

    if (!parsedDate) {
      ux.error(
        `${interval} isn't a supported time interval. Use a format like '1 day', '3 hours', '2 days 5 hours' for example. `
        + 'See https://devcenter.heroku.com/articles/heroku-postgres-rollback.',
      )
    }

    return parsedDate
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Fork)
    const {database} = args
    const {app, as, confirm, name, 'provision-option': provisionOpts, 'rollback-by': rollbackBy, 'rollback-to': rollbackTo, wait} = flags
    let {level} = flags

    // Parse provision options
    let provisionConfig: Record<string, string> = {}
    if (provisionOpts) {
      try {
        provisionConfig = parseProvisionOpts(provisionOpts)
      } catch (error) {
        ux.error(error instanceof Error ? error.message : String(error))
      }
    }

    const addonResolver = new utils.AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(database, app, utils.pg.addonService())

    const renderLegacyCommand = (): string => `heroku addons:create ${addon.plan.name}`
        + ` -a ${app}`
        + `${name ? ` --name ${name}` : ''}`
        + `${as ? ` --as ${as}` : ''}`
        + `${wait ? ' --wait' : ''}`
        + ` -- ${rollbackTo || rollbackBy ? '--rollback' : '--fork'} ${addon.name}`
        + `${rollbackTo ? ` --to '${rollbackTo}'` : ''}`
        + `${rollbackBy ? ` --by '${rollbackBy}'` : ''}`

    if (!utils.pg.isAdvancedDatabase(addon)) {
      ux.error(
        'You can only use this command on Advanced-tier databases.\n'
          + `Use ${color.code(renderLegacyCommand())} instead.`,
      )
    }

    if (!level) {
      const {body: databaseInfo} = await this.dataApi.get<InfoResponse>(`/data/postgres/v1/${addon.id}/info`)
      level = databaseInfo.pools.find(p => p.name === 'leader')?.expected_level
    }

    let recoveryTime: string | undefined

    if (rollbackTo) {
      recoveryTime = rollbackTo
    } else if (rollbackBy) {
      const parsedDate = this.parseRollbackInterval(rollbackBy)
      recoveryTime = this.formatRecoveryTime(parsedDate)
    }

    const config = recoveryTime
      ? {
        level,
        'recovery-time': recoveryTime,
        rollback: database,
        ...provisionConfig,
      }
      : {
        fork: database,
        level,
        ...provisionConfig,
      }

    try {
      const rollbackMessage = `with a rollback ${rollbackTo ? `to ${rollbackTo}` : `by ${rollbackBy}`}`
      const actionStartMessage = recoveryTime
        ? `Creating a fork for ${color.addon(addon.name)} on ${color.app(app)} ${rollbackMessage}`
        : `Creating a fork for ${color.addon(addon.name)} on ${color.app(app)}`
      await createAddon(this.heroku, app, addon.plan.name!, confirm, wait, {
        actionStartMessage, actionStopMessage: 'done', as, config, name,
      })

      if (wait) {
        this.notify('We successfully provisioned the database fork')
      }
    } catch (error) {
      ux.action.stop()

      if (wait) {
        this.notify(
          'We can\'t provision the database fork. Try again or open a ticket with Heroku Support: https://help.heroku.com/.',
          false,
        )
      }

      throw error
    }
  }

  /**
   * Formats a Date object to the backend-expected timestamp format.
   * Format: YYYY-MM-DDTHH:MM:SS (e.g., '2025-11-17T15:20:00')
   *
   * @param date - Date object to format
   * @returns Formatted timestamp string
   */
  private formatRecoveryTime(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }
}
