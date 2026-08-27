/* eslint-disable no-await-in-loop */
import {flags as Flags, HerokuAPIError} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {
  color, hux, pg, utils,
} from '@heroku/heroku-cli-util'
import {HTTP} from '@heroku/http-call'
import {ux} from '@oclif/core'
import ansiEscapes from 'ansi-escapes'
import inquirer, {DistinctChoice, ListChoiceMap} from 'inquirer'
import tsheredoc from 'tsheredoc'

import createAddon from '../../../lib/addons/create-addon.js'
import BaseCommand from '../../../lib/data/base-command.js'
import PoolConfig from '../../../lib/data/pool-config.js'
import {
  DatabaseStatus,
  ExtendedPostgresLevelInfo,
  InfoResponse,
  MigrationMethod,
  MigrationResponse,
  MigrationStatus,
} from '../../../lib/data/types.js'
import {fetchLevelsAndPricing} from '../../../lib/data/utils.js'
import {getAttachmentNamesByAddon} from '../../../lib/pg/util.js'

const heredoc = tsheredoc.default
const WATCH_INTERVAL_MS = 5000
const WATCH_MAX_SERVICE_UNAVAILABLE_RETRIES = 12

const {prompt, Separator} = inquirer

export default class DataPgMigrate extends BaseCommand {
  static description = 'migrate an existing classic Postgres database to an Advanced database'
  static flags = {
    app: Flags.app({required: true}),
    method: Flags.string({
      hidden: true,
      options: ['snapshot', 'streaming'],
    }),
    remote: Flags.remote(),
  }
  private advancedDatabases: Array<pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[], info?: InfoResponse}> = []
  private appName: string | undefined
  private classicDatabases: Array<pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[]}> = []
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private methodProvidedViaFlag = false
  private migrationTargets: Array<MigrationResponse> = []
  private selectedMigrationMethod?: MigrationMethod

  public async createAddon(...args: Parameters<typeof createAddon>): Promise<Heroku.AddOn> {
    return createAddon(...args)
  }

  public async prompt<T extends inquirer.Answers>(...args: Parameters<typeof inquirer.prompt<T>>): Promise<T> {
    return prompt<T>(...args)
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DataPgMigrate)
    const {app, method} = flags
    this.appName = app
    // If --method flag is provided, convert and store, and record that the method
    // came from the flag so the interactive selection step is skipped throughout.
    if (method !== undefined) {
      this.methodProvidedViaFlag = true
      this.selectedMigrationMethod = method === 'streaming' ? MigrationMethod.CDC : MigrationMethod.FULL_LOAD
    }

    ux.stdout(heredoc`

      Migrate existing classic Heroku Postgres databases to Advanced databases
      ${color.gray('Press Ctrl+C to cancel')}
    `)

    let exit = false
    while (!exit) {
      const action = await this.loopMainMenu(app)
      switch (action) {
        case '__configure_migration': {
          const migration = await this.configureMigration()
          if (migration) {
            await this.refreshState(app)
            if (!this.migrationTargets.some(candidate => candidate.id === migration.id)) this.replaceMigration(migration)
            const detailAction = await this.loopMigrationDetails(app, migration.id)
            exit = detailAction === '__exit'
          }

          break
        }

        case '__exit': {
          exit = true
          break
        }

        case '__refresh': {
          break
        }

        default: {
          const detailAction = await this.loopMigrationDetails(app, action)
          exit = detailAction === '__exit'
        }
      }
    }
  }

  private async actOnMigration(migration: MigrationResponse, migrationAction: 'cancel' | 'start'): Promise<MigrationResponse | undefined> {
    if (!await this.confirmMigrationAction(migration, migrationAction)) return undefined

    const method = this.migrationMethod(migration)
    let actionName = 'Starting migration'
    if (migrationAction === 'cancel') actionName = 'Canceling migration'
    else if (method === MigrationMethod.FULL_LOAD) actionName = 'Starting data copy'
    else if (method === MigrationMethod.CDC) actionName = 'Starting cutover'
    ux.stdout()
    ux.action.start(`${actionName} from ${this.databaseName(migration.source_id)} to ${this.databaseName(migration.target_id)}`)
    let failed = false
    let updatedMigration: MigrationResponse
    try {
      const {body} = await this.dataApi.post<MigrationResponse>(`/data/postgres/v1/${migration.target_id}/migrations/${migrationAction === 'start' ? 'run' : 'cancel'}`)
      updatedMigration = body
    } catch (error) {
      failed = true
      throw error
    } finally {
      ux.action.stop(failed ? 'failed' : undefined)
    }

    return updatedMigration
  }

  private canCancelMigration(migration: MigrationResponse): boolean {
    return migration.can_cancel === true
  }

  private canStartMigration(migration: MigrationResponse): boolean {
    return migration.can_start === true
  }

  private async configureMigration(): Promise<MigrationResponse | undefined> {
    // When the method wasn't provided via the --method flag, clear any method
    // selected during a previous migration in this session so a stale value can
    // never reach the migration request if the interactive step is ever skipped.
    if (!this.methodProvidedViaFlag) {
      this.selectedMigrationMethod = undefined
    }

    let currentStep = '__select_source'
    let sourceDatabaseId: string | undefined
    let targetDatabaseId: string | undefined
    let targetDatabaseName: string | undefined
    let migration: MigrationResponse | undefined

    const confirmMigration = async (): Promise<string> => {
      ux.stdout(color.info(heredoc`

        By continuing, we prepare the necessary steps for the migration.
        Your source database is available while we prepare the migration.
        You'll receive an email when the preparation is complete or if there's an error.
        You have 24 hours to begin the migration after the preparation is complete.
        Preparing the migration deletes all the data on the destination database ${color.datastore(targetDatabaseName!)}.

      `))
      const {action} = await this.prompt<{action: string}>({
        choices: [
          {name: 'Confirm', value: '__confirm'},
          {name: 'Go back', value: '__go_back'},
        ],
        message: 'Confirm migration configuration:',
        name: 'action',
        type: 'list',
      })
      return action
    }

    const selectMethod = async (): Promise<string> => {
      ux.stdout(color.info(heredoc`

        Migration methods:
        · Snapshot: Copies the data from the source database to the destination database. Requires downtime on the source database
          depending on the size. Best for smaller databases or when a maintenance window is acceptable.
        · Streaming: Replicates changes from the source database to the destination database continuously until you start the migration.
          Requires minimal downtime. Best for larger databases or when you need near-zero downtime.

      `))

      const {method} = await this.prompt<{method: string}>({
        choices: [
          {name: 'Snapshot', value: '__snapshot'},
          {name: 'Streaming', value: '__streaming'},
          new Separator(),
          {name: 'Go back', value: '__go_back'},
        ],
        message: 'Select the migration method:',
        name: 'method',
        type: 'list',
      })

      return method
    }

    const selectSource = async (): Promise<string> => {
      const choices: Array<DistinctChoice<{database: string}, ListChoiceMap<{database: string}>>> = []
      for (const database of this.classicDatabases) {
        const name = `${color.datastore(database.name)} as ${database.attachment_names!.map(name => color.attachment(name)).join(', ')}`
        if (this.migrationTargets.some(migration => migration.source_id === database.id && this.isActiveMigration(migration))) {
          choices.push({
            disabled: 'already a source database for an active migration',
            name: color.gray(name),
            value: database.id,
          })
        } else {
          choices.push({
            name,
            value: database.id,
          })
        }
      }

      choices.push(new Separator(), {name: 'Go back', value: '__go_back'})
      sourceDatabaseId = (await this.prompt<{database: string}>({
        choices,
        message: 'Select the source database:',
        name: 'database',
        type: 'list',
      })).database

      return sourceDatabaseId
    }

    const selectTarget = async (): Promise<string> => {
      const choices: Array<DistinctChoice<{database: string}, ListChoiceMap<{database: string}>>> = []
      for (const database of this.advancedDatabases) {
        const name = `${color.datastore(database.name)} as ${database.attachment_names!.map(name => color.attachment(name)).join(', ')}`
        if (this.migrationTargets.some(migration => migration.target_id === database.id && this.isActiveMigration(migration))) {
          choices.push({
            disabled: 'already a destination database for an active migration',
            name: color.gray(name),
            value: database.id,
          })
        } else if (database.info?.status === DatabaseStatus.AVAILABLE) {
          choices.push({
            name,
            value: database.id,
          })
        } else {
          choices.push({
            disabled: 'database isn\'t available',
            name: color.gray(name),
            value: database.id,
          })
        }
      }

      if (this.advancedDatabases.length === 0) {
        choices.push({
          disabled: true,
          name: color.gray(`No Heroku Postgres Advanced databases available for migration on ${color.app(this.appName!)}`),
          value: '__no_advanced_databases',
        })
      }

      choices.push(
        new Separator(),
        {name: 'Create a new Advanced database', value: '__create_database'},
        {name: 'Go back', value: '__go_back'},
      )
      targetDatabaseId = (await this.prompt<{database: string}>({
        choices,
        message: 'Select the destination database:',
        name: 'database',
        type: 'list',
      })).database
      targetDatabaseName = this.advancedDatabases.find(db => db.id === targetDatabaseId)?.name

      return targetDatabaseId
    }

    while (currentStep !== '__exit') {
      switch (currentStep) {
        case '__confirm_migration': {
          const action = await confirmMigration()
          if (action === '__go_back') {
            currentStep = this.methodProvidedViaFlag ? '__select_target' : '__select_method'
          } else if (action === '__confirm') {
            ux.stdout('')
            ux.action.start('Configuring migration')
            let failed = false
            try {
              const {body} = await this.dataApi.post<MigrationResponse>(`/data/postgres/v1/${targetDatabaseId}/migrations`, {
                body: {
                  method: this.selectedMigrationMethod!,
                  source_id: sourceDatabaseId,
                },
              })
              migration = body
            } catch (error) {
              failed = true
              throw error
            } finally {
              ux.action.stop(failed ? 'failed' : undefined)
            }

            currentStep = '__exit'
          }

          break
        }

        case '__select_method': {
          const method = await selectMethod()
          if (method === '__go_back') {
            currentStep = '__select_target'
          } else {
            this.selectedMigrationMethod = method === '__snapshot' ? MigrationMethod.FULL_LOAD : MigrationMethod.CDC
            currentStep = '__confirm_migration'
          }

          break
        }

        case '__select_source': {
          const sourceDatabaseId = await selectSource()
          currentStep = sourceDatabaseId === '__go_back' ? '__exit' : '__select_target'

          break
        }

        case '__select_target': {
          await selectTarget()
          if (targetDatabaseId === '__go_back') {
            currentStep = '__select_source'
          } else if (targetDatabaseId === '__create_database') {
            const addon = await this.createTargetDatabase(sourceDatabaseId!)
            if (addon) {
              targetDatabaseId = addon.id!
              targetDatabaseName = addon.name
              currentStep = this.methodProvidedViaFlag ? '__confirm_migration' : '__select_method'
            } else {
              currentStep = '__select_target'
            }
          } else {
            currentStep = this.methodProvidedViaFlag ? '__confirm_migration' : '__select_method'
          }

          break
        }
      }
    }

    return migration
  }

  private async confirmMigrationAction(migration: MigrationResponse, migrationAction: 'cancel' | 'start'): Promise<boolean> {
    const sourceDatabase = this.databaseName(migration.source_id)
    const method = this.migrationMethod(migration)

    if (migrationAction === 'cancel') {
      ux.stdout(color.info(heredoc`

        After canceling, you must create a new migration configuration and wait for the migration tooling to finish preparing to
        migrate ${sourceDatabase} again.

      `))
    } else if (method === MigrationMethod.FULL_LOAD) {
      ux.stdout(color.info(heredoc`

        Starting data copy makes your source database ${sourceDatabase} unavailable until the copy is complete.
        If there are any issues during the copy, we end the migration and make the source database available again.
        The source database can be offline for several hours during the copy.
        You'll receive an email when the migration is complete.
        You can't cancel the migration after starting data copy.

      `))
    } else if (method === MigrationMethod.CDC) {
      ux.stdout(color.info(heredoc`

        Starting cutover requests the migration to wait for replication to catch up and then block the source database ${sourceDatabase}.
        Stop all writers before continuing. Writers must remain stopped until cutover is complete.
        You'll receive an email when the migration is complete.

      `))
    } else {
      ux.stdout(color.info(heredoc`

        Your database ${sourceDatabase} will be unavailable after starting the migration until the migration is complete.
        If there are any issues during the migration, we end the migration and make the source database available again.
        The database ${sourceDatabase} can be offline for several hours during the migration.
        You'll receive an email when the migration is complete.
        You can't cancel the migration after starting it.

      `))
    }

    let actionName = 'start migration'
    if (migrationAction === 'cancel') actionName = 'cancel migration'
    else if (method === MigrationMethod.FULL_LOAD) actionName = 'start data copy'
    else if (method === MigrationMethod.CDC) actionName = 'start cutover'
    const {action} = await this.prompt<{action: string}>({
      choices: [
        {name: 'Confirm', value: '__confirm'},
        {name: 'Go back', value: '__go_back'},
      ],
      message: `Confirm to ${actionName}:`,
      name: 'action',
      type: 'list',
    })

    return action === '__confirm'
  }

  private async createTargetDatabase(sourceDatabaseId: string): Promise<Heroku.AddOn | undefined> {
    let networking: string | undefined
    const sourceDatabase = this.classicDatabases.find(db => db.id === sourceDatabaseId)!
    if (sourceDatabase.plan.name.split(':')[1].startsWith('private')) {
      networking = 'private'
    } else if (sourceDatabase.plan.name.split(':')[1].startsWith('shield')) {
      networking = 'shield'
    }

    const plan = `advanced${networking ? `-${networking}` : ''}`
    const service = utils.pg.addonService()
    const servicePlan = `${service}:${plan}`
    const {extendedLevelsInfo} = await fetchLevelsAndPricing(plan, this.dataApi)
    this.extendedLevelsInfo = extendedLevelsInfo
    const poolConfig = new PoolConfig(this.extendedLevelsInfo!, 0)

    ux.stdout(heredoc`

      → Configure Leader Pool

    `)

    const {action, highAvailability, level: leaderLevel} = await poolConfig.leaderInteractiveConfig(true)

    if (action === '__go_back') {
      return undefined
    }

    // Database cluster provisioning (leader pool)
    const config: Record<string, boolean | string | undefined> = {
      from: sourceDatabaseId,
      'high-availability': highAvailability,
      level: leaderLevel,
    }

    let addon: Heroku.AddOn | undefined
    try {
      addon = await this.createAddon(this.heroku, sourceDatabase.app.name, servicePlan, undefined, false, {
        actionStartMessage: `Creating a ${color.info(leaderLevel!)} database on ${color.app(sourceDatabase.app.name)}`,
        actionStopMessage: 'done',
        config,
      })
    } catch (error) {
      ux.action.stop()
      throw error
    }

    return addon
  }

  private databaseName(databaseId: string): string {
    const database = [...this.classicDatabases, ...this.advancedDatabases].find(db => db.id === databaseId)
    return database ? color.datastore(database.name) : color.gray('unknown')
  }

  private displayMigrationDetails(migration: MigrationResponse): void {
    ux.stdout(`${this.migrationDetails(migration)}\n`)
  }

  private formatFailureReason(failureReason: MigrationResponse['failure_reason']): string | undefined {
    return typeof failureReason?.summary === 'string' ? failureReason.summary : undefined
  }

  private formatPreassessment(preassessment: MigrationResponse['preassessment']): string | undefined {
    if (preassessment.status === 'pending') return 'Pending'
    if (preassessment.status === 'running') return 'Running'
    if (preassessment.status === 'error') return 'Could not complete'
    if (preassessment.status === 'unavailable') return undefined

    const failures = preassessment.failure_count
    const warnings = preassessment.warning_count
    if (failures > 0) {
      const blockingIssues = `${failures} blocking ${failures === 1 ? 'issue' : 'issues'}`
      return warnings > 0 ? `Found ${blockingIssues} and ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}` : `Found ${blockingIssues}`
    }

    return warnings > 0 ? `Passed with ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}` : 'Passed'
  }

  private formatStatus(status: string): string {
    return status
      .replaceAll(/[_-]+/g, ' ')
      .replaceAll(/\b\w/g, character => character.toUpperCase())
  }

  private async getAppDatabases(app: string): Promise<void> {
    const {body: appAttachments} = await this.heroku.get<pg.ExtendedAddonAttachment[]>(
      `/apps/${app}/addon-attachments`,
      {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Inclusion': 'addon:plan,config_vars',
        },
      },
    )
    const ownedDatabaseAttachments = appAttachments.filter(a => utils.pg.isPostgresAddon(a.addon) && a.addon.app.name === app)
    const ownedDatabaseAddons: Array<pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[]}> = []
    for (const attachment of ownedDatabaseAttachments) {
      if (!ownedDatabaseAddons.some(a => a.id === attachment.addon.id)) {
        ownedDatabaseAddons.push(attachment.addon)
      }
    }

    const attachmentNamesByAddon = getAttachmentNamesByAddon(ownedDatabaseAttachments)
    for (const addon of ownedDatabaseAddons) {
      addon.attachment_names = attachmentNamesByAddon[addon.id]
    }

    this.classicDatabases = ownedDatabaseAddons.filter(db => utils.pg.isLegacyDatabase(db) && !utils.pg.isEssentialDatabase(db))
    this.advancedDatabases = ownedDatabaseAddons.filter(db => utils.pg.isAdvancedDatabase(db))
  }

  private async getMigrationTargetsAndInfo(): Promise<void> {
    const migrationPromises = Promise.allSettled(this.advancedDatabases.map(db => this.dataApi.get<MigrationResponse>(`/data/postgres/v1/${db.id}/migrations`)))
    const infoPromises = Promise.allSettled(this.advancedDatabases.map(db => this.dataApi.get<InfoResponse>(`/data/postgres/v1/${db.id}/info`)))
    const [migrationResults, infoResults] = await Promise.all([migrationPromises, infoPromises])

    // 404 errors are expected for Advanced databases that are not a migration target (at least not yet)
    const unexpectedError = [...migrationResults, ...infoResults]
      .filter(queryResult => queryResult.status === 'rejected')
      .find(queryResult => {
        const error = (queryResult as PromiseRejectedResult).reason
        if (error instanceof HerokuAPIError) {
          return error.http.statusCode !== 404
        }

        return true
      })
    if (unexpectedError) {
      ux.error((unexpectedError as PromiseRejectedResult).reason)
    }

    for (const infoResult of infoResults) {
      if (infoResult.status === 'fulfilled') {
        const db = this.advancedDatabases.find(db => db.id === infoResult.value.body.addon.id)
        if (db) {
          db.info = infoResult.value.body
        }
      }
    }

    this.migrationTargets = migrationResults
      .filter(queryResult => queryResult.status === 'fulfilled')
      .map(queryResult => (queryResult as PromiseFulfilledResult<HTTP<MigrationResponse>>).value.body)
  }

  private isActiveMigration(migration: MigrationResponse): boolean {
    return migration.status === MigrationStatus.CANCELLING
      || migration.status === MigrationStatus.CREATING_TARGET
      || migration.status === MigrationStatus.PREPARING
      || migration.status === MigrationStatus.MIGRATING
      || migration.status === MigrationStatus.PROMOTING
      || migration.status === MigrationStatus.READY
  }

  private isServiceUnavailable(error: unknown): boolean {
    return error instanceof HerokuAPIError && error.http.statusCode === 503
  }

  private async loopMainMenu(app: string): Promise<string> {
    await this.refreshState(app)

    const pendingMigrations = this.classicDatabases.filter(db => !this.migrationTargets.some(migration => migration.source_id === db.id && this.isActiveMigration(migration)))
    const visibleMigrations = this.orderedMigrations().filter(migration => migration.status !== MigrationStatus.CANCELLED || this.isActiveMigration(migration))

    if (visibleMigrations.length === 0) {
      ux.stdout(`You haven't configured any migrations for ${color.app(app)} yet.\n`)
    }

    const choices: Array<DistinctChoice<{action: string}, ListChoiceMap<{action: string}>>> = []
    for (const migration of visibleMigrations) {
      choices.push({name: this.migrationSummary(migration), value: migration.id})
    }

    if (pendingMigrations.length > 0) {
      choices.push({
        name: 'Configure a new migration',
        value: '__configure_migration',
      })
    } else {
      choices.push({
        disabled: `no classic Postgres databases pending migration on ${color.app(app)}`,
        name: color.gray('Configure a new migration'),
        value: '__configure_migration',
      })
    }

    choices.push({name: 'Refresh', value: '__refresh'}, new Separator(), {name: 'Exit', value: '__exit'})

    const {action} = await this.prompt<{action: string}>({
      choices,
      message: 'Select a migration or action:',
      name: 'action',
      type: 'list',
    })
    return action
  }

  private async loopMigrationDetails(app: string, migrationId: string): Promise<'__back' | '__exit'> {
    while (true) {
      const migration = this.migrationTargets.find(candidate => candidate.id === migrationId)
      if (!migration) return '__back'

      this.displayMigrationDetails(migration)
      const choices: Array<DistinctChoice<{action: string}, ListChoiceMap<{action: string}>>> = []
      if (this.canStartMigration(migration)) {
        const method = this.migrationMethod(migration)
        let name = 'Start migration'
        if (method === MigrationMethod.FULL_LOAD) name = 'Start data copy'
        else if (method === MigrationMethod.CDC) name = 'Start cutover'

        choices.push({
          name,
          value: '__start_migration',
        })
      }

      if (this.canCancelMigration(migration)) choices.push({name: 'Cancel migration', value: '__cancel_migration'})
      if (choices.length > 0) choices.push(new Separator())
      if (this.isActiveMigration(migration)) choices.push({name: 'Watch status', value: '__watch'})
      choices.push(
        {name: 'Refresh status', value: '__refresh'},
        new Separator(),
        {name: 'Back to migrations', value: '__back'},
        {name: 'Exit', value: '__exit'},
      )

      const {action} = await this.prompt<{action: string}>({
        choices,
        message: 'What do you want to do?:',
        name: 'action',
        pageSize: choices.length,
        type: 'list',
      })

      if (action === '__exit' || action === '__back') return action
      if (action === '__refresh') {
        await this.refreshState(app)
        if (!this.migrationTargets.some(candidate => candidate.id === migrationId)) return '__back'
      } else if (action === '__watch') {
        if (!await this.watchMigration(migration)) return '__back'
      } else {
        const updatedMigration = await this.actOnMigration(migration, action === '__start_migration' ? 'start' : 'cancel')
        if (updatedMigration) this.replaceMigration(updatedMigration)
      }
    }
  }

  private migrationDetails(migration: MigrationResponse): string {
    const sourceStatus = migration.source_status ? color.gray(` (${migration.source_status.replaceAll('_', ' ')})`) : ''
    const failureReason = this.formatFailureReason(migration.failure_reason)
    const status = migration.status === MigrationStatus.FAILED && failureReason
      ? `${this.migrationStatusDescription(migration)} (${failureReason})`
      : this.migrationStatusDescription(migration)
    const details = [
      ['Source', `${this.databaseName(migration.source_id)}${sourceStatus}`],
      ['Destination', this.databaseName(migration.target_id)],
      ['Method', this.migrationMethodName(migration) ?? 'Unknown'],
      ['Status', status],
    ]

    if (migration.tables_errored !== null && migration.tables_errored !== undefined && migration.tables_errored > 0) details.push(['Tables errored', migration.tables_errored.toString()])

    const preassessment = this.formatPreassessment(migration.preassessment)
    if (preassessment) details.push(['Pre-assessment', preassessment])

    const fields = hux.alignColumns(details.map(([label, value]) => [`${color.label(label)}:`, value]))
      .map(field => field.trimEnd())
    return `\n${color.label('=== ')}${color.label('Migration details')}\n\n${fields.join('\n')}`
  }

  private migrationMethod(migration: MigrationResponse): MigrationMethod | undefined {
    if (migration.requested_method === MigrationMethod.CDC || migration.requested_method === MigrationMethod.FULL_LOAD) {
      return migration.requested_method
    }

    return undefined
  }

  private migrationMethodName(migration: MigrationResponse): 'Snapshot' | 'Streaming' | undefined {
    const method = this.migrationMethod(migration)
    if (method === MigrationMethod.FULL_LOAD) return 'Snapshot'
    if (method === MigrationMethod.CDC) return 'Streaming'

    return undefined
  }

  private migrationStatusDescription(migration: MigrationResponse): string {
    if (migration.status_description) return migration.status_description

    return this.formatStatus(migration.status)
  }

  private migrationSummary(migration: MigrationResponse): string {
    const method = this.migrationMethodName(migration)
    const methodSummary = method ? ` | ${method}` : ''
    return `${this.databaseName(migration.source_id)} -> ${this.databaseName(migration.target_id)}${methodSummary} | ${color.info(this.migrationStatusDescription(migration))}`
  }

  private orderedMigrations(): MigrationResponse[] {
    const relevance = (migration: MigrationResponse): number => {
      if (this.isActiveMigration(migration)
        || migration.can_start === true
        || migration.can_cancel === true) return 0
      if (migration.completed || [MigrationStatus.CANCELLED, MigrationStatus.COMPLETED, MigrationStatus.FAILED].includes(migration.status)) return 2
      return 1
    }

    return this.migrationTargets
      .map((migration, index) => ({index, migration}))
      .sort((left, right) => relevance(left.migration) - relevance(right.migration) || left.index - right.index)
      .map(({migration}) => migration)
  }

  private async refreshState(app: string): Promise<void> {
    await this.getAppDatabases(app)
    await this.getMigrationTargetsAndInfo()
  }

  private renderMigrationWatch(migration: MigrationResponse): void {
    const content = `${this.migrationDetails(migration)}\n\nWatching status every 5 seconds. Press any key to stop.\n`
    process.stdout.write(`${ansiEscapes.cursorTo(0, 0)}${ansiEscapes.eraseDown}${content}`)
  }

  private replaceMigration(migration: MigrationResponse): void {
    const index = this.migrationTargets.findIndex(candidate => candidate.id === migration.id)
    if (index === -1) this.migrationTargets.push(migration)
    else this.migrationTargets[index] = migration
  }

  private async requestMigration(migration: MigrationResponse): Promise<MigrationResponse | undefined> {
    try {
      const {body} = await this.dataApi.get<MigrationResponse>(`/data/postgres/v1/${migration.target_id}/migrations`)
      return body.id === migration.id ? body : undefined
    } catch (error) {
      if (error instanceof HerokuAPIError && error.http.statusCode === 404) return undefined
      throw error
    }
  }

  private waitForWatchInput(): Promise<'interrupt' | 'keypress' | 'timeout'> {
    return new Promise(resolve => {
      const onData = (input: Buffer | string): void => {
        clearTimeout(timeout)
        resolve(input.toString().includes('\u0003') ? 'interrupt' : 'keypress')
      }

      const timeout = setTimeout(() => {
        process.stdin.removeListener('data', onData)
        process.stdin.pause()
        resolve('timeout')
      }, WATCH_INTERVAL_MS)

      process.stdin.once('data', onData)
      process.stdin.resume()
    })
  }

  private async watchMigration(initialMigration: MigrationResponse): Promise<boolean> {
    if (!process.stdin.isTTY || !process.stdout.isTTY || process.env.TERM === 'dumb') {
      const migration = await this.requestMigration(initialMigration)
      if (migration) this.replaceMigration(migration)
      return Boolean(migration)
    }

    const stdinWasPaused = process.stdin.isPaused()
    const stdinWasRaw = process.stdin.isRaw === true
    let migration = initialMigration
    let serviceUnavailableRetries = 0

    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdout.write(`\u001B[?1049h${ansiEscapes.cursorHide}`)

    try {
      while (true) {
        this.renderMigrationWatch(migration)
        const input = await this.waitForWatchInput()
        if (input === 'keypress') return true
        if (input === 'interrupt') throw new Error('SIGINT')

        let updatedMigration: MigrationResponse | undefined
        try {
          updatedMigration = await this.requestMigration(migration)
          serviceUnavailableRetries = 0
        } catch (error) {
          if (!this.isServiceUnavailable(error) || serviceUnavailableRetries >= WATCH_MAX_SERVICE_UNAVAILABLE_RETRIES) throw error
          serviceUnavailableRetries++
          continue
        }

        if (!updatedMigration) return false

        const startBecameAvailable = !this.canStartMigration(migration) && this.canStartMigration(updatedMigration)
        const reachedTerminalStatus = [MigrationStatus.CANCELLED, MigrationStatus.COMPLETED, MigrationStatus.FAILED]
          .includes(updatedMigration.status)
        this.replaceMigration(updatedMigration)
        migration = updatedMigration
        if (startBecameAvailable || reachedTerminalStatus) return true
      }
    } finally {
      process.stdin.setRawMode(stdinWasRaw)
      if (stdinWasPaused) process.stdin.pause()
      else process.stdin.resume()
      process.stdout.write(`${ansiEscapes.cursorShow}\u001B[?1049l`)
    }
  }
}
