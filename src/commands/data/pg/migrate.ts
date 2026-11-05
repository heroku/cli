/* eslint-disable no-await-in-loop */
import {flags as Flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {
  color, hux, utils,
} from '@heroku/heroku-cli-util'
import {
  type Migration, type MigrationSource, type MigrationTarget, postgresMigrationExtensions,
} from '@heroku/sdk/extensions/data'
import {isCancellable, isRunnable} from '@heroku/sdk/resources/data/postgres-migration'
import {ux} from '@oclif/core'
import inquirer, {DistinctChoice, ListChoiceMap} from 'inquirer'
import tsheredoc from 'tsheredoc'

import createAddon from '../../../lib/addons/create-addon.js'
import BaseCommand from '../../../lib/data/base-command.js'
import PoolConfig from '../../../lib/data/pool-config.js'
import {ExtendedPostgresLevelInfo} from '../../../lib/data/types.js'
import {fetchLevelsAndPricing} from '../../../lib/data/utils.js'
import {createSDK} from '../../../lib/sdk.js'
import {huxTableNoWrapOptions} from '../../../lib/utils/table-utils.js'

const heredoc = tsheredoc

const {prompt, Separator} = inquirer

type Data = ReturnType<typeof createSDK<readonly [typeof postgresMigrationExtensions]>>['data']
type DropFirst<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never
// hux.table requires its row type to extend `Record<string, unknown>`, which the
// SDK's `Migration` interface doesn't satisfy on its own; intersect to pass it.
type MigrationRow = Migration & Record<string, unknown>

export default class DataPgMigrate extends BaseCommand {
  static description = 'migrate an existing classic Postgres database to an Advanced database'
  static flags = {
    app: Flags.app({required: true}),
    method: Flags.string({
      hidden: true,
      options: ['snapshot', 'streaming'],
    }),
    'no-wrap': Flags.noWrap(),
    remote: Flags.remote(),
  }
  private advancedDatabases: MigrationTarget[] = []
  private appName: string | undefined
  private classicDatabases: MigrationSource[] = []
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private methodProvidedViaFlag = false
  private migrationTargets: Migration[] = []
  private noWrap = false
  private selectedMigrationMethod?: 'cdc' | 'full-load'

  public async createAddon(...args: DropFirst<Parameters<typeof createAddon>>): Promise<Heroku.AddOn> {
    return createAddon(this.heroku, ...args)
  }

  public async prompt<T extends inquirer.Answers>(...args: Parameters<typeof inquirer.prompt<T>>): Promise<T> {
    return prompt<T>(...args)
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DataPgMigrate)
    const {app, method} = flags
    this.appName = app
    this.noWrap = flags['no-wrap']

    const {data} = createSDK(this.heroku, {extensions: [postgresMigrationExtensions]})

    // If --method flag is provided, convert and store, and record that the method
    // came from the flag so the interactive selection step is skipped throughout.
    if (method !== undefined) {
      this.methodProvidedViaFlag = true
      this.selectedMigrationMethod = method === 'streaming' ? 'cdc' : 'full-load'
    }

    ux.stdout(heredoc`

      Migrate existing classic Heroku Postgres databases to Advanced databases
      ${color.gray('Press Ctrl+C to cancel')}
    `)

    let action: string | undefined
    do {
      action = await this.loopMainMenu(data, app)
      switch (action) {
        case '__cancel_migration': {
          await this.actOnReadyMigration(data, 'cancel')
          break
        }

        case '__configure_migration': {
          await this.configureMigration(data)
          break
        }

        case '__exit': {
          break
        }

        case '__refresh': {
          break
        }

        case '__start_migration': {
          await this.actOnReadyMigration(data, 'start')
          break
        }
      }
    } while (action !== '__exit')
  }

  // eslint-disable-next-line complexity
  private async actOnReadyMigration(data: Data, migrationAction: 'cancel' | 'start'): Promise<void> {
    const eligible = migrationAction === 'start' ? isRunnable : isCancellable
    const readyMigrations = this.migrationTargets.filter(migration => eligible(migration.status))
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
            try {
              await (migrationAction === 'start'
                ? data.postgresMigration.startWhenReady(selectedMigration.target_id)
                : data.postgresMigration.abortBeforeRun(selectedMigration.target_id))
              ux.action.stop()
            } catch (error) {
              ux.action.stop(color.red('!'))
              throw error
            }

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

  private async configureMigration(data: Data): Promise<void> {
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
        · Snapshot: Copies the data from the source database to the destination database. Requires downtime on the source database depending on the size. Best for smaller databases or when a maintenance window is acceptable.
        · Streaming: Replicates changes from the source database to the destination database continuously until you start the migration. Requires minimal downtime. Best for larger databases or when you need near-zero downtime.

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
        const name = `${color.datastore(database.name)} as ${database.attachmentNames.map(name => color.attachment(name)).join(', ')}`
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
        const name = `${color.datastore(database.name)} as ${database.attachmentNames.map(name => color.attachment(name)).join(', ')}`
        if (this.migrationTargets.some(migration => migration.target_id === database.id && this.isActiveMigration(migration))) {
          choices.push({
            disabled: 'already a destination database for an active migration',
            name: color.gray(name),
            value: database.id,
          })
        } else if (database.info?.status === 'available') {
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
            await this.prepareMigration(data, sourceDatabaseId, targetDatabaseId, this.selectedMigrationMethod)
            currentStep = '__exit'
          }

          break
        }

        case '__select_method': {
          const method = await selectMethod()
          if (method === '__go_back') {
            currentStep = '__select_target'
          } else {
            this.selectedMigrationMethod = method === '__snapshot' ? 'full-load' : 'cdc'
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
      addon = await this.createAddon(sourceDatabase.app.name, servicePlan, undefined, false, {
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

  private isActiveMigration(migration: Migration): boolean {
    return migration.status === 'creating_target'
      || migration.status === 'preparing'
      || migration.status === 'migrating'
      || migration.status === 'promoting'
      || migration.status === 'ready'
  }

  private async loopMainMenu(data: Data, app: string): Promise<string> {
    // Fetch the app's classic migration sources, Advanced targets (each with its
    // `info` and any migration targeting it), and all configured migrations in a
    // single pass.
    const {migrations, sources, targets} = await data.postgresMigration.listMigrationContext(app)
    this.classicDatabases = sources
    this.advancedDatabases = targets
    this.migrationTargets = migrations

    const pendingMigrations = this.classicDatabases.filter(db => !this.migrationTargets.some(migration => migration.source_id === db.id && this.isActiveMigration(migration)))

    hux.styledHeader('Configured Migrations')

    if (this.migrationTargets.length > 0) {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(this.migrationTargets as MigrationRow[], {
        source: {
          get: (migration: MigrationRow) => color.datastore(this.classicDatabases.find(db => db.id === migration.source_id)?.name ?? color.gray('unknown')),
          header: 'Source Database',
        },
        destination: {
          get: (migration: MigrationRow) => color.datastore(this.advancedDatabases.find(db => db.id === migration.target_id)?.name ?? color.gray('unknown')),
          header: 'Destination Database',
        },
        status: {
          get: (migration: MigrationRow) => migration.status_description ?? '',
          header: 'Status',
        },
      }, huxTableNoWrapOptions(this.noWrap))
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

    if (this.migrationTargets.some(migration => isRunnable(migration.status) || isCancellable(migration.status))) {
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

    choices.push(new Separator(), {name: 'Refresh', value: '__refresh'}, {name: 'Exit', value: '__exit'})

    const {action} = await this.prompt<{action: string}>({
      choices,
      message: 'What do you want to do?:',
      name: 'action',
      type: 'list',
    })
    return action
  }

  // Guard the resolved source/target ids before issuing the prepare request: the
  // ids arrive as `string | undefined` (they're `let`s mutated inside the
  // selectSource/selectTarget closures, which TS can't narrow across the closure
  // boundary). Guarding here lets the call sites drop their non-null assertions
  // and keeps a leaked menu sentinel (a `__`-prefixed value) from ever being sent
  // to the API as a database id.
  private async prepareMigration(
    data: Data,
    sourceId: string | undefined,
    targetId: string | undefined,
    method: 'cdc' | 'full-load' | undefined,
  ): Promise<void> {
    if (!sourceId || sourceId.startsWith('__') || !targetId || targetId.startsWith('__') || !method) {
      throw new Error('Migration configuration is incomplete. Reconfigure the migration and try again.')
    }

    ux.action.start('Configuring migration')
    try {
      await data.postgresMigration.prepare(targetId, {
        method,
        source_id: sourceId,
      })
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
