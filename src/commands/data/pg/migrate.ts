/* eslint-disable no-await-in-loop */
import {flags as Flags, HerokuAPIError} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {
  color, hux, pg, utils,
} from '@heroku/heroku-cli-util'
import {HTTP} from '@heroku/http-call'
import {ux} from '@oclif/core'
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
import {PgDatabaseService} from '../../../lib/pg/types.js'
import {getAttachmentNamesByAddon} from '../../../lib/pg/util.js'
import {huxTableNoWrapOptions} from '../../../lib/utils/table-utils.js'

const heredoc = tsheredoc

const {prompt, Separator} = inquirer

// Labels for the transfer strategies a migration can use
const migrationMethodLabels: Partial<Record<string, string>> = {
  dms_assess_only: 'Assessment only',
  dms_migrate: 'Snapshot',
  dms_migrate_cdc: 'Streaming',
  dump_restore: 'Snapshot',
  pgcopydb_migrate: 'Snapshot',
}

export default class DataPgMigrate extends BaseCommand {
  static description = 'migrate an existing classic Postgres database to an Advanced database'
  static flags = {
    app: Flags.app({required: true}),
    method: Flags.string({
      hidden: true,
      options: ['snapshot'],
    }),
    'no-wrap': Flags.noWrap(),
    remote: Flags.remote(),
  }
  private advancedDatabases: Array<pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[], info?: InfoResponse}> = []
  private appName: string | undefined
  private classicDatabases: Array<pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[], status?: string, version?: string}> = []
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private methodProvidedViaFlag = false
  private migrationTargets: Array<MigrationResponse> = []
  private noWrap = false
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
    this.noWrap = flags['no-wrap']
    // If --method flag is provided, convert and store, and record that the method
    // came from the flag so the interactive selection step is skipped throughout.
    if (method !== undefined) {
      this.methodProvidedViaFlag = true
      this.selectedMigrationMethod = MigrationMethod.FULL_LOAD
    }

    ux.stdout(heredoc`

      Migrate existing classic Heroku Postgres databases to Advanced databases
      ${color.gray('Press Ctrl+C to cancel')}
    `)

    let action: string | undefined
    do {
      action = await this.loopMainMenu(app)
      switch (action) {
        case '__configure_migration': {
          const migrationId = await this.configureMigration()
          if (migrationId) {
            await this.refreshDatabasesAndMigrations()
            await this.manageMigration(migrationId)
          }

          break
        }

        case '__exit': {
          break
        }

        case '__refresh': {
          break
        }

        default: {
          // Any other choice is the ID of a migration to manage
          await this.manageMigration(action)
        }
      }
    } while (action !== '__exit')
  }

  // Returns the ID of the configured migration, or undefined if the user went back
  private async configureMigration(): Promise<string | undefined> {
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
    let targetDatabaseVersion: string | undefined

    const confirmMigration = async (): Promise<string> => {
      ux.stdout(color.info(heredoc`

        By continuing, we prepare the necessary steps for the migration.
        Your source database is available while we prepare the migration.
        You'll receive an email when the preparation is complete or if there's an error.
        You have 24 hours to begin the migration after the preparation is complete.
        Preparing the migration deletes all the data on the destination database ${color.datastore(targetDatabaseName!)}.

      `))
      this.printVersionChangeWarning(this.classicDatabases.find(db => db.id === sourceDatabaseId)?.version, targetDatabaseVersion)
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
        · Snapshot: Copies the data from the source database to the destination database. Requires downtime on the source database depending on the size. Best for smaller databases or when a maintenance window is acceptable.

      `))

      const {method} = await this.prompt<{method: string}>({
        choices: [
          {name: 'Snapshot', value: '__snapshot'},
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
        const name = `${color.datastore(database.name)}${this.versionLabel(database.version)} `
          + `as ${database.attachment_names!.map(name => color.attachment(name)).join(', ')}`
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
        const name = `${color.datastore(database.name)}${this.versionLabel(database.info?.version)} `
          + `as ${database.attachment_names!.map(name => color.attachment(name)).join(', ')}`
        if (this.migrationTargets.some(migration => migration.target_id === database.id && this.isActiveMigration(migration))) {
          choices.push({
            disabled: 'already a destination database for an active migration',
            name: color.gray(name),
            value: database.id,
          })
        } else if (database.info?.status === DatabaseStatus.AVAILABLE || database.info?.status === DatabaseStatus.PROVISIONING) {
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
      const targetDatabase = this.advancedDatabases.find(db => db.id === targetDatabaseId)
      targetDatabaseName = targetDatabase?.name
      targetDatabaseVersion = targetDatabase?.info?.version

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
            const {body: migration} = await this.dataApi.post<MigrationResponse>(`/data/postgres/v1/${targetDatabaseId}/migrations`, {
              body: {
                method: this.selectedMigrationMethod!,
                source_id: sourceDatabaseId,
              },
            })
            ux.action.stop()
            return migration.id
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

    return undefined
  }

  // Returns whether the user confirmed the action
  private async confirmMigrationAction(migration: MigrationResponse, migrationAction: 'cancel' | 'start'): Promise<boolean> {
    const sourceDatabase = this.classicDatabases.find(db => db.id === migration.source_id)
    const targetDatabase = this.advancedDatabases.find(db => db.id === migration.target_id)

    if (migrationAction === 'start') {
      ux.stdout(color.info(heredoc`

        Your database ${this.databaseName(sourceDatabase)} will be unavailable after starting the migration until the migration is complete.
        If there are any issues during the migration, we end the migration and make the source database available again.
        The database ${this.databaseName(sourceDatabase)} can be offline for several hours during the migration.
        You'll receive an email when the migration is complete.

      `))
      this.printVersionChangeWarning(sourceDatabase?.version, targetDatabase?.info?.version)
    } else {
      ux.stdout()
      if (migration.status === MigrationStatus.MIGRATING) {
        ux.stdout(color.info(heredoc`
          Canceling stops the running migration and makes ${this.databaseName(sourceDatabase)} available again.
          You'll receive an email when ${this.databaseName(sourceDatabase)} is available.
        `.trimEnd()))
      }

      ux.stdout(color.info(heredoc`
        After canceling, you must create a new migration configuration and wait for the migration tooling to finish preparing to
        migrate ${this.databaseName(sourceDatabase)} again.

      `))
    }

    const {action} = await this.prompt<{action: string}>({
      choices: [
        {name: 'Confirm', value: '__confirm'},
        {name: 'Go back', value: '__go_back'},
      ],
      message: `Confirm to ${migrationAction} migration:`,
      name: 'action',
      type: 'list',
    })
    if (action === '__confirm') {
      ux.stdout()
      ux.action.start(`${migrationAction === 'start' ? 'Starting' : 'Canceling'} migration of ${this.databaseName(sourceDatabase)} `
        + `to ${this.databaseName(targetDatabase)}`)
      await this.dataApi.post(`/data/postgres/v1/${migration.target_id}/migrations/${migrationAction === 'start' ? 'run' : 'cancel'}`)
      ux.action.stop()
    }

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
      'high-availability': highAvailability,
      level: leaderLevel,
    }
    const version = this.majorVersion(sourceDatabase.version)
    if (version) {
      config.version = version
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

  // e.g. ⛁ postgresql-name (DATABASE_URL) - Postgres 17.6 - Available
  private databaseDetails(database: undefined | {attachment_names?: string[], name: string}, version?: string, status?: string): string {
    const attachments = database?.attachment_names?.map(name => color.attachment(name)).join(', ')
    return [
      this.databaseName(database) + (attachments ? ` (${attachments})` : ''),
      version && `Postgres ${version}`,
      status,
    ].filter(Boolean).join(' - ')
  }

  private databaseName(database?: {name: string}): string {
    return color.datastore(database?.name ?? color.gray('unknown'))
  }

  // Matches the data:pg:info timestamp format, e.g. 2026-10-21 16:00 UTC
  private formatTimestamp(timestamp?: null | string): string | undefined {
    return timestamp ? `${new Date(timestamp).toISOString().slice(0, 16).replace('T', ' ')} UTC` : undefined
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
    // The source database version and status are only informational, so failures fetching them are ignored
    const sourceInfoPromises = Promise.allSettled(this.classicDatabases.map(async db => {
      const {body} = await this.dataApi.get<PgDatabaseService>(`/client/v11/databases/${db.id}`)
      db.version = body.postgres_version || undefined
      db.status = body.info?.find(info => info.name === 'Status')?.values[0]
    }))
    const [migrationResults, infoResults] = await Promise.all([migrationPromises, infoPromises, sourceInfoPromises])

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

  // A canceling migration keeps its databases until the cancellation finishes cleaning up
  private isActiveMigration(migration: MigrationResponse): boolean {
    return migration.status === MigrationStatus.CANCELLING
      || migration.status === MigrationStatus.CREATING_TARGET
      || migration.status === MigrationStatus.PREPARING
      || migration.status === MigrationStatus.MIGRATING
      || migration.status === MigrationStatus.PROMOTING
      || migration.status === MigrationStatus.READY
  }

  private async loopMainMenu(app: string): Promise<string> {
    // Update our database lists
    await this.refreshDatabasesAndMigrations()

    const pendingMigrations = this.classicDatabases.filter(db => !this.migrationTargets.some(migration => migration.source_id === db.id && this.isActiveMigration(migration)))

    hux.styledHeader('Configured Migrations')

    if (this.migrationTargets.length > 0) {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(this.migrationTargets, {
        source: {
          get: (migration: MigrationResponse) => this.databaseName(this.classicDatabases.find(db => db.id === migration.source_id)),
          header: 'Source Database',
        },
        destination: {
          get: (migration: MigrationResponse) => this.databaseName(this.advancedDatabases.find(db => db.id === migration.target_id)),
          header: 'Destination Database',
        },
        method: {
          get: (migration: MigrationResponse) => this.methodLabel(migration) ?? '',
          header: 'Method',
        },
        status: {
          get: (migration: MigrationResponse) => migration.status_description,
          header: 'Status',
        },
      }, huxTableNoWrapOptions(this.noWrap))
      /* eslint-enable perfectionist/sort-objects */
    } else {
      ux.stdout(`You haven't configured any migrations for ${color.app(app)} yet.\n`)
    }

    const choices: Array<DistinctChoice<{action: string}, ListChoiceMap<{action: string}>>> = this.migrationTargets.map(migration => ({
      name: `Manage migration from ${this.databaseName(this.classicDatabases.find(db => db.id === migration.source_id))} `
        + `to ${this.databaseName(this.advancedDatabases.find(db => db.id === migration.target_id))}`,
      value: migration.id,
    }))

    if (pendingMigrations.length > 0) {
      choices.push({
        name: 'Configure a new database migration',
        value: '__configure_migration',
      })
    } else {
      choices.push({
        disabled: `no classic Postgres databases pending migration on ${color.app(app)}`,
        name: color.gray('Configure a new database migration'),
        value: '__configure_migration',
      })
    }

    choices.push(new Separator(), {name: 'Refresh', value: '__refresh'}, {name: 'Exit', value: '__exit'})

    const {action} = await this.prompt<{action: string}>({
      choices,
      message: 'What do you want to do?:',
      name: 'action',
      type: 'list',
    })
    return action
  }

  // Versions can include the minor version (e.g. '16.4'), but we only compare and provision by major version
  private majorVersion(version?: string): string | undefined {
    return version?.split('.')[0]
  }

  private async manageMigration(migrationId: string): Promise<void> {
    let action: string | undefined
    do {
      const migration = this.migrationTargets.find(migration => migration.id === migrationId)
      if (!migration) {
        ux.stdout(color.warning('\nThe migration is no longer available. Either a newer migration replaced it or its destination database was removed.\n'))
        return
      }

      this.printMigrationDetails(migration)

      // Disabled choices without a reason show the default "(Disabled)"
      const actionChoice = (name: string, value: string, enabled: boolean, disabledReason?: null | string) => (
        enabled ? {name, value} : {disabled: disabledReason || true, name: color.gray(name), value}
      )
      action = (await this.prompt<{action: string}>({
        choices: [
          {name: 'Refresh migration details', value: '__refresh'},
          // The API decides whether a migration can be started or canceled, and why not
          actionChoice('Start the migration', '__start_migration', Boolean(migration.can_start), migration.start_disabled_reason),
          actionChoice('Cancel the migration', '__cancel_migration', Boolean(migration.can_cancel), migration.cancel_disabled_reason),
          new Separator(),
          {name: 'Go back', value: '__go_back'},
        ],
        message: 'What do you want to do?:',
        name: 'action',
        type: 'list',
      })).action

      // Going back from the confirmation changes nothing, so there's nothing to refresh
      let refresh = action === '__refresh'
      if (action === '__start_migration' || action === '__cancel_migration') {
        refresh = await this.confirmMigrationAction(migration, action === '__start_migration' ? 'start' : 'cancel')
      }

      if (refresh) {
        await this.refreshDatabasesAndMigrations()
      }
    } while (action !== '__go_back')
  }

  private methodLabel(migration: MigrationResponse): string | undefined {
    return migration.migration_strategy ? migrationMethodLabels[migration.migration_strategy] : undefined
  }

  private printMigrationDetails(migration: MigrationResponse): void {
    const sourceDatabase = this.classicDatabases.find(db => db.id === migration.source_id)
    const targetDatabase = this.advancedDatabases.find(db => db.id === migration.target_id)

    // Details without a value are omitted
    /* eslint-disable perfectionist/sort-objects */
    const details: Record<string, string | undefined> = {
      Source: this.databaseDetails(sourceDatabase, sourceDatabase?.version, sourceDatabase?.status),
      Destination: this.databaseDetails(targetDatabase, targetDatabase?.info?.version, hux.toTitleCase(targetDatabase?.info?.status)),
      Method: this.methodLabel(migration),
      'Migration configured at': this.formatTimestamp(migration.created_at),
      Status: migration.status_description,
    }
    /* eslint-enable perfectionist/sort-objects */

    ux.stdout()
    hux.styledHeader('Migration details')
    hux.styledObject(details)
    ux.stdout()
  }

  private printVersionChangeWarning(sourceVersion?: string, targetVersion?: string): void {
    const sourceMajorVersion = this.majorVersion(sourceVersion)
    const targetMajorVersion = this.majorVersion(targetVersion)
    if (!sourceMajorVersion || !targetMajorVersion || sourceMajorVersion === targetMajorVersion) {
      return
    }

    ux.stdout(color.warning(heredoc`
      Warning: The destination database runs Postgres ${targetVersion}, but the source database runs Postgres ${sourceVersion}.

    `))
  }

  private async refreshDatabasesAndMigrations(): Promise<void> {
    await this.getAppDatabases(this.appName!)
    await this.getMigrationTargetsAndInfo()
  }

  private versionLabel(version?: string): string {
    return version ? ` ${color.gray(`v${version}`)}` : ''
  }
}
