import {
  color, hux, pg, utils,
} from '@heroku/heroku-cli-util'
import {HTTP} from '@heroku/http-call'
import {flags as Flags, HerokuAPIError} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import inquirer, {DistinctChoice, ListChoiceMap} from 'inquirer'
import tsheredoc from 'tsheredoc'

import createAddon from '../../../lib/addons/create_addon.js'
import BaseCommand from '../../../lib/data/baseCommand.js'
import PoolConfig from '../../../lib/data/poolConfig.js'
import {ExtendedPostgresLevelInfo, MigrationResponse} from '../../../lib/data/types.js'
import {fetchLevelsAndPricing} from '../../../lib/data/utils.js'
import {getAttachmentNamesByAddon} from '../../../lib/pg/util.js'

const heredoc = tsheredoc.default
// eslint-disable-next-line import/no-named-as-default-member
const {Separator, prompt} = inquirer

export default class DataPgMigrate extends BaseCommand {
  static description = 'migrate an existing classic Postgres database to an Advanced database'

  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  private advancedDatabases: Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']> = []
  private classicDatabases: Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']> = []
  private extendedLevelsInfo: ExtendedPostgresLevelInfo[] | undefined
  private migrationTargets: Array<MigrationResponse> = []

  public async createAddon(...args: Parameters<typeof createAddon>): Promise<Heroku.AddOn> {
    return createAddon(...args)
  }

  public async prompt<T extends inquirer.Answers>(...args: Parameters<typeof inquirer.prompt<T>>): Promise<T> {
    return prompt<T>(...args)
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DataPgMigrate)
    const {app} = flags

    ux.stdout(heredoc`

      Migrate existing classic Heroku Postgres databases to Advanced databases
      ${color.dim('Press Ctrl+C to cancel')}
    `)

    let action: string | undefined
    do {
      action = await this.loopMainMenu(app)
      switch (action) {
      case '__configure_migration': {
        await this.configureMigration()
        break
      }

      case '__start_migration': {
        await this.actOnReadyMigration('start')
        break
      }

      case '__cancel_migration': {
        await this.actOnReadyMigration('cancel')
        break
      }

      case '__exit': {
        break
      }
      }
    } while (action !== '__exit')
  }

  private async actOnReadyMigration(migrationAction: 'cancel' | 'start'): Promise<void> {
    const readyMigrations = this.migrationTargets.filter(migration => migration.status === 'ready')
    let currentStep = '__select_migration'
    let selectedMigrationId: string | undefined

    while (currentStep !== '__exit') {
      switch (currentStep) {
      case '__select_migration': {
        const choices: Array<DistinctChoice<{ migration: string }, ListChoiceMap<{ migration: string }>>> = []
        for (const migration of readyMigrations) {
          const sourceDatabase = this.classicDatabases.find(db => db.id === migration.source_id)!
          const targetDatabase = this.advancedDatabases.find(db => db.id === migration.target_id)!
          const name = `From ${color.datastore(sourceDatabase.name)} to ${color.datastore(targetDatabase.name)}`
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

        if (selectedMigrationId === '__go_back') {
          currentStep = '__exit'
        } else {
          currentStep = '__confirm_action'
        }

        break
      }

      case '__confirm_action': {
        const selectedMigration = readyMigrations.find(migration => migration.id === selectedMigrationId)!
        const sourceDatabase = this.classicDatabases.find(db => db.id === selectedMigration.source_id)!
        const targetDatabase = this.advancedDatabases.find(db => db.id === selectedMigration.target_id)!

        if (migrationAction === 'start') {
          ux.stdout(color.info(heredoc`

            Your database ${color.datastore(sourceDatabase.name)} will be unavailable after starting the migration until the migration is complete.
            If there are any issues during the migration, we end the migration and make the source database available again.
            The database ${color.datastore(sourceDatabase.name)} can be offline for several hours during the migration.
            You'll receive an email when the migration is complete.
            You can't cancel the migration after starting it.

          `))
        } else {
          ux.stdout(color.info(heredoc`

            After cancelling, you'll have to manually remove the destination database (${color.datastore(targetDatabase.name)}), recreate the migration configuration
            and wait for the migration tooling to be prepared again in order to migrate ${color.datastore(sourceDatabase.name)}.
            Run ${color.code(`heroku data:pg:destroy ${targetDatabase.name} -a ${targetDatabase.app.name}`)} to remove the destination database if you don't need it anymore.

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
          ux.stdout('\n')
          ux.action.start(`${migrationAction === 'start' ? 'Starting' : 'Cancelling'} migration of ${color.datastore(sourceDatabase.name)} to ${color.datastore(targetDatabase.name)}`)
          await this.dataApi.post(`/data/postgres/v1/${selectedMigration.target_id}/migrations/${migrationAction === 'start' ? 'run' : 'cancel'}`)
          ux.action.stop()
          currentStep = '__exit'
        }

        break
      }
      }
    }
  }

  private async configureMigration(): Promise<void> {
    let currentStep = '__select_source'
    let sourceDatabaseId: string | undefined
    let targetDatabaseId: string | undefined

    while (currentStep !== '__exit') {
      switch (currentStep) {
      case '__select_source': {
        const choices: Array<DistinctChoice<{ database: string }, ListChoiceMap<{ database: string }>>> = []
        for (const database of this.classicDatabases) {
          const name = `${color.datastore(database.name)} as ${database.attachment_names!.map(name => color.attachment(name)).join(', ')}`
          if (this.migrationTargets.some(migration => migration.source_id === database.id)) {
            choices.push({
              disabled: 'already a migration source',
              name: color.dim(name),
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

        if (sourceDatabaseId === '__go_back') {
          currentStep = '__exit'
        } else {
          currentStep = '__select_target'
        }

        break
      }

      case '__select_target': {
        const choices: Array<DistinctChoice<{ database: string }, ListChoiceMap<{ database: string }>>> = []
        for (const database of this.advancedDatabases) {
          const name = `${color.datastore(database.name)} as ${database.attachment_names!.map(name => color.attachment(name)).join(', ')}`
          if (this.migrationTargets.some(migration => migration.target_id === database.id)) {
            choices.push({
              disabled: 'already a migration destination',
              name: color.dim(name),
              value: database.id,
            })
          } else {
            choices.push({
              name,
              value: database.id,
            })
          }
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

        if (targetDatabaseId === '__go_back') {
          currentStep = '__select_source'
        } else if (targetDatabaseId === '__create_database') {
          const addon = await this.createTargetDatabase(sourceDatabaseId!)
          if (addon) {
            targetDatabaseId = addon.id
            currentStep = '__confirm_migration'
          } else {
            currentStep = '__select_target'
          }
        } else {
          currentStep = '__confirm_migration'
        }

        break
      }

      case '__confirm_migration': {
        ux.stdout(color.info(heredoc`

          By continuing, we prepare the necessary steps for the migration.
          Your source database is available while we prepare the migration.
          You'll receive an email when the preparation is complete or if there's an error.
          You have 24 hours to begin migration after the preparation is complete.
          Your source database will be unavailable during the migration.

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
          ux.stdout('\n')
          ux.action.start('Configuring migration')
          await this.dataApi.post<MigrationResponse>(`/data/postgres/v1/${targetDatabaseId}/migrations`, {
            body: {source_id: sourceDatabaseId},
          })
          ux.action.stop()
          currentStep = '__exit'
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
      'high-availability': highAvailability,
      level: leaderLevel,
    }

    let addon: Heroku.AddOn | undefined
    try {
      addon = await this.createAddon(this.heroku, sourceDatabase.app.name, servicePlan, undefined, false, {
        actionStartMessage: `Creating a ${color.cyan(leaderLevel)} database on ${color.app(sourceDatabase.app.name)}`,
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
    const ownedDatabaseAddons: Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']> = []
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

  private async getMigrationTargets(): Promise<void> {
    const migrationPromises = this.advancedDatabases.map(db => this.dataApi.get<MigrationResponse>(`/data/postgres/v1/${db.id}/migrations`))
    const migrationResults = await Promise.allSettled(migrationPromises)

    // 404 errors are expected for Advanced databases that are not a migration target (at least not yet)
    const unexpectedError = migrationResults
      .filter(migrationResult => migrationResult.status === 'rejected')
      .find(migrationResult => {
        const error = (migrationResult as PromiseRejectedResult).reason
        if (error instanceof HerokuAPIError) {
          return error.http.statusCode !== 404
        }

        return true
      })
    if (unexpectedError) {
      ux.error((unexpectedError as PromiseRejectedResult).reason)
    }

    this.migrationTargets = migrationResults
      .filter(migrationResult => migrationResult.status === 'fulfilled')
      .map(migrationResult => (migrationResult as PromiseFulfilledResult<HTTP<MigrationResponse>>).value.body)
  }

  private async loopMainMenu(app: string): Promise<string> {
    // Update our database lists
    await this.getAppDatabases(app)
    await this.getMigrationTargets()

    const pendingMigrations = this.classicDatabases.filter(
      db => !this.migrationTargets.some(migration => migration.source_id === db.id),
    )

    hux.styledHeader('Configured migrations')

    if (this.migrationTargets.length > 0) {
      /* eslint-disable perfectionist/sort-objects */
      hux.table(this.migrationTargets, {
        source: {
          get: (migration: MigrationResponse) => color.datastore(this.classicDatabases.find(db => db.id === migration.source_id)!.name),
          header: 'Source Database',
        },
        destination: {
          get: (migration: MigrationResponse) => color.datastore(this.advancedDatabases.find(db => db.id === migration.target_id)!.name),
          header: 'Destination Database',
        },
        status: {
          get: (migration: MigrationResponse) => color.info(hux.toTitleCase(migration.status)!),
          header: 'Status',
        },
      })
      /* eslint-enable perfectionist/sort-objects */
    } else {
      ux.stdout(`\nThere are no migrations configured for ${color.app(app)} yet.\n`)
    }

    const choices: Array<DistinctChoice<{ action: string }, ListChoiceMap<{ action: string }>>> = []

    if (pendingMigrations.length > 0) {
      choices.push({
        name: 'Configure a new migration',
        value: '__configure_migration',
      })
    } else {
      choices.push({
        disabled: `no classic Postgres databases pending migration on ${color.app(app)}`,
        name: color.dim('Configure a new migration'),
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
        name: color.dim('Start a migration'),
        value: '__start_migration',
      }, {
        disabled: disabledReason,
        name: color.dim('Cancel a migration'),
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
