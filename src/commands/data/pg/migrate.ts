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
  MigrationResponse,
  MigrationStatus,
} from '../../../lib/data/types.js'
import {fetchLevelsAndPricing} from '../../../lib/data/utils.js'
import {getAttachmentNamesByAddon} from '../../../lib/pg/util.js'

const heredoc = tsheredoc.default

const {prompt, Separator} = inquirer

export default class DataPgMigrate extends BaseCommand {
  static description = 'migrate an existing classic Postgres database to an Advanced database'
  static flags = {
    app: Flags.app({required: true}),
    method: Flags.string({
      default: 'snapshot',
      hidden: true,
      options: ['snapshot', 'streaming'],
    }),
    remote: Flags.remote(),
  }
  private advancedDatabases: Array<pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[], info?: InfoResponse}> = []
  private appName: string | undefined
  private classicDatabases: Array<pg.ExtendedAddonAttachment['addon'] & {attachment_names?: string[]}> = []
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private migrationMethod: 'cdc' | 'full-load' = 'full-load'
  private migrationTargets: Array<MigrationResponse> = []

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
    this.migrationMethod = method === 'streaming' ? 'cdc' : 'full-load'

    ux.stdout(heredoc`

      Migrate existing classic Heroku Postgres databases to Advanced databases
      ${color.gray('Press Ctrl+C to cancel')}
    `)

    let action: string | undefined
    do {
      action = await this.loopMainMenu(app)
      switch (action) {
        case '__cancel_migration': {
          await this.actOnReadyMigration('cancel')
          break
        }

        case '__configure_migration': {
          await this.configureMigration()
          break
        }

        case '__exit': {
          break
        }

        case '__start_migration': {
          await this.actOnReadyMigration('start')
          break
        }
      }
    } while (action !== '__exit')
  }

  // eslint-disable-next-line complexity
  private async actOnReadyMigration(migrationAction: 'cancel' | 'start'): Promise<void> {
    const readyMigrations = this.migrationTargets.filter(migration => migration.status === MigrationStatus.READY)
    let currentStep = '__select_migration'
    let selectedMigrationId: string | undefined

    while (currentStep !== '__exit') {
      switch (currentStep) {
        case '__confirm_action': {
          const selectedMigration = readyMigrations.find(migration => migration.id === selectedMigrationId)!
          const sourceDatabase = this.classicDatabases.find(db => db.id === selectedMigration.source_id)
          const targetDatabase = this.advancedDatabases.find(db => db.id === selectedMigration.target_id)

          if (migrationAction === 'start') {
            ux.stdout(color.info(heredoc`

            Your database ${color.datastore(sourceDatabase?.name ?? color.gray('unknown'))} will be unavailable after starting the migration until the migration is complete.
            If there are any issues during the migration, we end the migration and make the source database available again.
            The database ${color.datastore(sourceDatabase?.name ?? color.gray('unknown'))} can be offline for several hours during the migration.
            You'll receive an email when the migration is complete.
            You can't cancel the migration after starting it.

          `))
          } else {
            ux.stdout(color.info(heredoc`

            After canceling, you must create a new migration configuration and wait for the migration tooling to finish preparing to
            migrate ${color.datastore(sourceDatabase?.name ?? color.gray('unknown'))} again.

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
          if (action === '__go_back') {
            currentStep = '__select_migration'
          } else if (action === '__confirm') {
            ux.stdout()
            ux.action.start(`${migrationAction === 'start' ? 'Starting' : 'Canceling'} migration of ${color.datastore(sourceDatabase?.name ?? color.gray('unknown'))} `
              + `to ${color.datastore(targetDatabase?.name ?? color.gray('unknown'))}`)
            await this.dataApi.post(`/data/postgres/v1/${selectedMigration.target_id}/migrations/${migrationAction === 'start' ? 'run' : 'cancel'}`)
            ux.action.stop()
            currentStep = '__exit'
          }

          break
        }

        case '__select_migration': {
          const choices: Array<DistinctChoice<{migration: string}, ListChoiceMap<{migration: string}>>> = []
          for (const migration of readyMigrations) {
            const sourceDatabase = this.classicDatabases.find(db => db.id === migration.source_id)
            const targetDatabase = this.advancedDatabases.find(db => db.id === migration.target_id)
            const name = `From ${color.datastore(sourceDatabase?.name ?? color.gray('unknown'))} to ${color.datastore(targetDatabase?.name ?? color.gray('unknown'))}`
            choices.push({
              name,
              value: migration.id,
            })
          }

          choices.push(new Separator(), {name: 'Go back', value: '__go_back'})
          selectedMigrationId = (await this.prompt<{migration: string}>({
            choices,
            message: `Select the migration to ${migrationAction}:`,
            name: 'migration',
            type: 'list',
          })).migration

          currentStep = selectedMigrationId === '__go_back' ? '__exit' : '__confirm_action'

          break
        }
      }
    }
  }

  private async configureMigration(): Promise<void> {
    let currentStep = '__select_source'
    let sourceDatabaseId: string | undefined
    let targetDatabaseId: string | undefined
    let targetDatabaseName: string | undefined

    while (currentStep !== '__exit') {
      switch (currentStep) {
        case '__confirm_migration': {
          ux.stdout(color.info(heredoc`

          By continuing, we prepare the necessary steps for the migration.
          Your source database is available while we prepare the migration.
          You'll receive an email when the preparation is complete or if there's an error.
          You have 24 hours to begin migration after the preparation is complete.
          Your source database will be unavailable during the migration.
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
          if (action === '__go_back') {
            currentStep = '__select_target'
          } else if (action === '__confirm') {
            ux.stdout('')
            ux.action.start('Configuring migration')
            await this.dataApi.post<MigrationResponse>(`/data/postgres/v1/${targetDatabaseId}/migrations`, {
              body: {method: this.migrationMethod, source_id: sourceDatabaseId},
            })
            ux.action.stop()
            currentStep = '__exit'
          }

          break
        }

        case '__select_source': {
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

          currentStep = sourceDatabaseId === '__go_back' ? '__exit' : '__select_target'

          break
        }

        case '__select_target': {
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

          if (targetDatabaseId === '__go_back') {
            currentStep = '__select_source'
          } else if (targetDatabaseId === '__create_database') {
            const addon = await this.createTargetDatabase(sourceDatabaseId!)
            if (addon) {
              targetDatabaseId = addon.id
              targetDatabaseName = addon.name
              currentStep = '__confirm_migration'
            } else {
              currentStep = '__select_target'
            }
          } else {
            currentStep = '__confirm_migration'
          }

          break
        }
      }
    }
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
    return migration.status === MigrationStatus.CREATING_TARGET
      || migration.status === MigrationStatus.PREPARING
      || migration.status === MigrationStatus.MIGRATING
      || migration.status === MigrationStatus.PROMOTING
      || migration.status === MigrationStatus.READY
  }

  private async loopMainMenu(app: string): Promise<string> {
    // Update our database lists
    await this.getAppDatabases(app)
    await this.getMigrationTargetsAndInfo()

    const pendingMigrations = this.classicDatabases.filter(db => !this.migrationTargets.some(migration => migration.source_id === db.id && this.isActiveMigration(migration)))

    hux.styledHeader('Configured Migrations')

    if (this.migrationTargets.length > 0) {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(this.migrationTargets, {
        source: {
          get: (migration: MigrationResponse) => color.datastore(this.classicDatabases.find(db => db.id === migration.source_id)?.name ?? color.gray('unknown')),
          header: 'Source Database',
        },
        destination: {
          get: (migration: MigrationResponse) => color.datastore(this.advancedDatabases.find(db => db.id === migration.target_id)?.name ?? color.gray('unknown')),
          header: 'Destination Database',
        },
        status: {
          get: (migration: MigrationResponse) => (migration.status === MigrationStatus.MIGRATING && migration.status_description)
            ? color.info(migration.status_description)
            : color.info(migration.status === MigrationStatus.CANCELLED ? 'Canceled' : hux.toTitleCase(migration.status)!),
          header: 'Status',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    } else {
      ux.stdout(`You haven't configured any migrations for ${color.app(app)} yet.\n`)
    }

    const choices: Array<DistinctChoice<{action: string}, ListChoiceMap<{action: string}>>> = []

    if (pendingMigrations.length > 0) {
      choices.push({
        name: 'Configure a database migration',
        value: '__configure_migration',
      })
    } else {
      choices.push({
        disabled: `no classic Postgres databases pending migration on ${color.app(app)}`,
        name: color.gray('Configure a database migration'),
        value: '__configure_migration',
      })
    }

    if (this.migrationTargets.some(migration => migration.status === 'ready')) {
      choices.push({
        name: 'Start a migration',
        value: '__start_migration',
      }, {
        name: 'Cancel a migration',
        value: '__cancel_migration',
      })
    } else {
      const disabledReason = `no ready migrations on ${color.app(app)}`
      choices.push({
        disabled: disabledReason,
        name: color.gray('Start a migration'),
        value: '__start_migration',
      }, {
        disabled: disabledReason,
        name: color.gray('Cancel a migration'),
        value: '__cancel_migration',
      })
    }

    choices.push(new Separator(), {name: 'Exit', value: '__exit'})

    const {action} = await this.prompt<{action: string}>({
      choices,
      message: 'What do you want to do?:',
      name: 'action',
      type: 'list',
    })
    return action
  }
}
