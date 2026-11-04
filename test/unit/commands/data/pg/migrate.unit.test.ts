/* eslint-disable import/no-named-as-default-member */
import type {Migration, MigrationSource, MigrationTarget} from '@heroku/sdk/extensions/data'

import * as Heroku from '@heroku-cli/schema'
import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {expect} from 'chai'
import inquirer from 'inquirer'
import mockStdin from 'mock-stdin'
import nock from 'nock'
import sinon from 'sinon'

import DataPgMigrate from '../../../../../src/commands/data/pg/migrate.js'
import PoolConfig from '../../../../../src/lib/data/pool-config.js'
import {DatabaseStatus, MigrationStatus} from '../../../../../src/lib/data/types.js'
import {clearLevelsAndPricingCache} from '../../../../../src/lib/data/utils.js'
import {
  createdMigrationResponse,
  existentMigrationResponse,
  levelsResponse,
  nonTargetAdvancedDbAttachment,
  nonTargetAdvancedDbInfo,
  premiumDbAttachment,
  pricingResponse,
  privateDbAttachment,
  shieldDbAttachment,
  standardDbAttachment,
  targetAdvancedDbAttachment,
  targetAdvancedDbInfo,
  unavailableAdvancedDbAttachment,
  unavailableAdvancedDbInfo,
} from '../../../../fixtures/data/pg/fixtures.js'

const {prompt} = inquirer

// Keystroke that selects the main menu's "Exit" option. inquirer's list prompt
// re-indexes only the *enabled, non-separator* choices (`realChoices`) starting
// at 0, and arrow keys wrap around that list. "Exit" is always the last choice,
// so a single Up press from the initial cursor lands on it no matter how many
// options are enabled. A bare Enter would select whatever option is first
// (never Exit), re-entering the menu and hanging on empty stdin — so every
// test's final keystroke uses EXIT, not '\n'.
const EXIT = '\u001B[A\n'

type MigrationContext = {
  migrations: Migration[]
  sources: MigrationSource[]
  targets: MigrationTarget[]
}

// The command no longer fetches addon-attachments or per-database migration/info
// itself — data.postgresMigration.listMigrationContext resolves the already
// classified sources (classic, owned, non-Essential), targets (Advanced, each
// with its availability `info` and any migration targeting it), and the flat
// migration list in one pass. These helpers build that pre-derived shape from
// the attachment fixtures so each test stubs the SDK's output directly.
type Attachment = {addon: {id: string; name: string}; name: string}

const toSource = (attachment: Attachment): MigrationSource =>
  ({...(attachment.addon as object), attachmentNames: [attachment.name]}) as unknown as MigrationSource

const toTarget = (attachment: Attachment, info?: unknown, migration?: Migration): MigrationTarget =>
  ({
    ...(attachment.addon as object), attachmentNames: [attachment.name], info, migration,
  }) as unknown as MigrationTarget

const asMigration = (migration: unknown): Migration => migration as unknown as Migration

const migrationContext = (overrides: Partial<MigrationContext> = {}): MigrationContext => ({
  migrations: [],
  sources: [],
  targets: [],
  ...overrides,
})

// Classic sources (premium enabled, standard already a source via the existing
// migration), Advanced targets (nonTarget available, targetAdvanced already a
// destination, unavailable not available), and the one existing migration
// (source standard, target targetAdvanced).
const existingCandidateContext = (): MigrationContext => migrationContext({
  migrations: [asMigration(existentMigrationResponse)],
  sources: [toSource(premiumDbAttachment), toSource(standardDbAttachment)],
  targets: [
    toTarget(nonTargetAdvancedDbAttachment, nonTargetAdvancedDbInfo),
    toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo),
    toTarget(unavailableAdvancedDbAttachment, unavailableAdvancedDbInfo),
  ],
})

interface FakeData {
  postgresMigration: {
    cancel: sinon.SinonStub
    create: sinon.SinonStub
    listMigrationContext: sinon.SinonStub
    run: sinon.SinonStub
  }
}

describe('data:pg:migrate', function () {
  let createAddonStub: sinon.SinonStub
  let fakeData: FakeData
  let mockedStdinInput: string[] = []
  let poolConfigLeaderInteractiveConfigStub: sinon.SinonStub
  let stdin: mockStdin.MockSTDIN

  beforeEach(function () {
    createAddonStub = sinon.stub(DataPgMigrate.prototype, 'createAddon')
    poolConfigLeaderInteractiveConfigStub = sinon.stub(PoolConfig.prototype, 'leaderInteractiveConfig')
    fakeData = {
      postgresMigration: {
        cancel: sinon.stub().resolves(asMigration(existentMigrationResponse)),
        create: sinon.stub().resolves(asMigration(createdMigrationResponse)),
        listMigrationContext: sinon.stub().resolves(migrationContext()),
        run: sinon.stub().resolves(asMigration(existentMigrationResponse)),
      },
    }
    sinon.stub(HerokuSDK.prototype, 'data').get(() => fakeData)
    stdin = mockStdin.stdin()
    sinon.stub(DataPgMigrate.prototype, 'prompt').callsFake(async (...args: Parameters<typeof prompt>) => {
      process.nextTick(() => {
        const input = mockedStdinInput.shift()
        if (input) {
          stdin.send(input)
        } else {
          stdin.end()
        }
      })
      return prompt(...args)
    })
  })

  afterEach(function () {
    clearLevelsAndPricingCache()
    sinon.restore()
    stdin.restore()
    nock.cleanAll()
  })

  describe('main menu loop, without configured migrations', function () {
    it('hides the table output and shows the no migrations message', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext())

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).not.to.match(/Source Database\s+Destination Database\s+Status/)
      expect(stdout).to.contain('You haven\'t configured any migrations for ⬢ myapp yet.')
    })

    it('enables configuring a new migration option when there are classic databases owned by the app', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        sources: [toSource(standardDbAttachment)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('Configure a database migration')
      expect(stdout).not.to.contain('no classic Postgres databases pending migration on ⬢ myapp')
    })

    it('disables configuring a new migration option when there are no classic databases owned by the app', async function () {
      // The SDK filters out foreign classic databases, so none reach the command.
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext())

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Configure a database migration (no classic Postgres databases pending migration on ⬢ myapp)')
    })

    it('disables the start and cancel migration options', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        sources: [toSource(standardDbAttachment)],
        targets: [toTarget(nonTargetAdvancedDbAttachment, nonTargetAdvancedDbInfo)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Start a migration (no ready migrations on ⬢ myapp)')
      expect(stdout).to.contain('- Cancel a migration (no ready migrations on ⬢ myapp)')
    })
  })

  describe('main menu loop, with configured migrations', function () {
    it('shows the configured migrations table', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration(existentMigrationResponse)],
        sources: [toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.match(/Source Database\s+Destination Database\s+Status/)
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Preparing databases/)
    })

    it('accepts the --no-wrap flag and renders the migrations table', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration(existentMigrationResponse)],
        sources: [toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--no-wrap'])

      expect(stderr).to.equal('')
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Preparing databases/)
    })

    it('shows the status description in place of the status when present', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration({
          ...existentMigrationResponse,
          status: MigrationStatus.MIGRATING,
          status_description: 'syncing',
        })],
        sources: [toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+syncing/)
    })

    it('re-fetches and re-renders the view when Refresh is selected', async function () {
      fakeData.postgresMigration.listMigrationContext
        .onFirstCall().resolves(migrationContext({
          migrations: [asMigration({...existentMigrationResponse, status: MigrationStatus.PREPARING})],
          sources: [toSource(standardDbAttachment)],
          targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
        }))
        .resolves(migrationContext({
          migrations: [asMigration({
            ...existentMigrationResponse,
            status: MigrationStatus.MIGRATING,
            status_description: 'Migrating data',
          })],
          sources: [toSource(standardDbAttachment)],
          targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
        }))

      // First input selects Refresh (Up/Up/Enter wraps back onto Refresh), second exits.
      mockedStdinInput = ['\u001B[A\u001B[A\n', EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Preparing databases/)
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Migrating data/)
    })

    it('disables configuring a new migration option when there are no additional classic databases pending migration', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration(existentMigrationResponse)],
        sources: [toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Configure a database migration (no classic Postgres databases pending migration on ⬢ myapp)')
    })

    it('enables configuring a new migration option when there are additional classic databases pending migration', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration(existentMigrationResponse)],
        sources: [toSource(standardDbAttachment), toSource(premiumDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.contain('Configure a database migration')
      expect(stdout).not.to.contain('no classic Postgres databases pending migration on ⬢ myapp')
    })

    it('disables the start and cancel migration options if there are no ready migrations', async function () {
      const nonReadyStatuses = Object.values(MigrationStatus).filter(status => status !== MigrationStatus.READY)
      mockedStdinInput = Array.from({length: nonReadyStatuses.length}, () => EXIT)

      for (const status of nonReadyStatuses) {
        fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
          migrations: [asMigration({...existentMigrationResponse, status})],
          sources: [toSource(standardDbAttachment)],
          targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
        }))

        // eslint-disable-next-line no-await-in-loop
        const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

        expect(stderr).to.equal('')
        expect(stdout).to.contain('- Start a migration (no ready migrations on ⬢ myapp)')
        expect(stdout).to.contain('- Cancel a migration (no ready migrations on ⬢ myapp)')
      }
    })

    it('enables the start and cancel migration options if there are ready migrations', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration({
          ...existentMigrationResponse,
          status: MigrationStatus.READY,
          status_description: 'Ready to promote',
        })],
        sources: [toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [EXIT]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('')
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Ready to promote/)
      expect(stdout).to.contain('Start a migration')
      expect(stdout).to.contain('Cancel a migration')
      expect(stdout).not.to.contain('no ready migrations on ⬢ myapp')
    })
  })

  describe('configure a database migration with an existing candidate target database for the migration', function () {
    beforeEach(function () {
      fakeData.postgresMigration.listMigrationContext.resolves(existingCandidateContext())
    })

    it('creates a new migration configuration when confirmed', async function () {
      // After the migration is created, the next menu refresh shows it in the table.
      fakeData.postgresMigration.listMigrationContext
        .onFirstCall().resolves(existingCandidateContext())
        .resolves(migrationContext({
          migrations: [asMigration(existentMigrationResponse), asMigration(createdMigrationResponse)],
          sources: [toSource(premiumDbAttachment), toSource(standardDbAttachment)],
          targets: [
            toTarget(nonTargetAdvancedDbAttachment, nonTargetAdvancedDbInfo),
            toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo),
            toTarget(unavailableAdvancedDbAttachment, unavailableAdvancedDbInfo),
          ],
        }))

      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      expect(fakeData.postgresMigration.create.calledOnce).to.be.true
      expect(fakeData.postgresMigration.create.firstCall.args[0]).to.equal(nonTargetAdvancedDbAttachment.addon.id)
      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'full-load',
        source_id: premiumDbAttachment.addon.id,
      })
      expect(stderr).to.equal('Configuring migration... done\n')
      // The new migration is shown in the refreshed configured migrations table.
      expect(stdout).to.match(/⛁ postgresql-convex-12345\s+⛁ postgresql-obscured-12345\s+Preparing databases/)
    })

    it('shows the expected list of source databases', async function () {
      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      const sourceDatabaseList = stdout.match(/(?<=Select the source database: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(stderr).to.equal('Configuring migration... done\n')
      // The database that is already a migration source should be disabled.
      expect(sourceDatabaseList).to.contain(`⛁ ${standardDbAttachment.addon.name} as STANDARD_DB (already a source database for an active migration)`)
      // The Premium database should be enabled.
      expect(sourceDatabaseList).to.contain(`⛁ ${premiumDbAttachment.addon.name} as PREMIUM_DB`)
      expect(sourceDatabaseList).not.to.contain(`⛁ ${premiumDbAttachment.addon.name} as PREMIUM_DB (already a source database for an active migration)`)
    })

    it('shows the expected list of target databases', async function () {
      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      const targetDatabaseList = stdout.match(/(?<=Select the destination database: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(stderr).to.equal('Configuring migration... done\n')
      // The database that is already a migration destination should be disabled.
      expect(targetDatabaseList).to.contain(`⛁ ${targetAdvancedDbAttachment.addon.name} as ADVANCED_DB (already a destination database for an active migration)`)
      // The non-target Advanced database should be enabled.
      expect(targetDatabaseList).to.contain(`⛁ ${nonTargetAdvancedDbAttachment.addon.name} as OTHER_ADVANCED_DB`)
      expect(targetDatabaseList).not.to.contain(`⛁ ${nonTargetAdvancedDbAttachment.addon.name} as OTHER_ADVANCED_DB (already a destination database for an active migration)`)
      // The unavailable database should be disabled.
      expect(targetDatabaseList).to.contain(`⛁ ${unavailableAdvancedDbAttachment.addon.name} as UNAVAILABLE_DB (database isn't available)`)
    })

    it('allows the user to navigate back on every step', async function () {
      mockedStdinInput = [
        '\n',         // Main menu: > Configure a database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\u001B[A\n', // Confirm migration configuration: > Go back
        '\u001B[A\n', // Select target database: > Go back
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        EXIT,         // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout.match(/Select the source database: \(Use arrow keys\)/g)?.length).to.equal(2)
      expect(stdout.match(/Select the destination database: \(Use arrow keys\)/g)?.length).to.equal(3)
      expect(stdout.match(/Confirm migration configuration: \(Use arrow keys\)/g)?.length).to.equal(2)
    })
  })

  describe('configure a database migration with the hidden --method flag', function () {
    it('sends method=cdc when --method=streaming', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        sources: [toSource(premiumDbAttachment)],
        targets: [toTarget(nonTargetAdvancedDbAttachment, nonTargetAdvancedDbInfo)],
      }))

      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=streaming'])

      expect(fakeData.postgresMigration.create.firstCall.args[0]).to.equal(nonTargetAdvancedDbAttachment.addon.id)
      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'cdc',
        source_id: premiumDbAttachment.addon.id,
      })
      expect(stderr).to.equal('Configuring migration... done\n')
    })

    it('rejects unsupported method values', async function () {
      const {error} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=bogus'])
      expect(error?.message).to.match(/Expected --method=bogus to be one of: snapshot, streaming/)
    })
  })

  describe('configure a database migration with a new target database created for the migration', function () {
    beforeEach(function () {
      poolConfigLeaderInteractiveConfigStub.resolves({
        action: '__confirm',
        highAvailability: true,
        level: '4G-Performance',
      })
      createAddonStub.resolves(nonTargetAdvancedDbAttachment.addon as unknown as Heroku.AddOn)
      // Creating the new target database still fetches levels/pricing over the
      // data API (not migrated). These endpoints are fixed regardless of tier.
      nock('https://api.data.heroku.com')
        .persist()
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
    })

    it('creates a database without private or shield networking for a non-Private/Shield source database', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration(existentMigrationResponse)],
        sources: [toSource(premiumDbAttachment), toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Create a new Advanced database
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain('→ Configure Leader Pool')
      expect(createAddonStub.calledOnce).to.be.true
      expect(createAddonStub.args[0][0]).to.equal(premiumDbAttachment.addon.app.name)
      // No private or shield networking.
      expect(createAddonStub.args[0][1]).to.equal('heroku-postgresql:advanced')
      expect(createAddonStub.args[0][4]).to.deep.include({
        config: {
          from: premiumDbAttachment.addon.id,
          'high-availability': true,
          level: '4G-Performance',
        },
      })
      // The migration is created against the newly provisioned target database.
      expect(fakeData.postgresMigration.create.firstCall.args[0]).to.equal(nonTargetAdvancedDbAttachment.addon.id)
      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'full-load',
        source_id: premiumDbAttachment.addon.id,
      })
    })

    it('creates a database with private networking for a Private source database', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration(existentMigrationResponse)],
        sources: [toSource(privateDbAttachment), toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Private database
        '\n', // Select target database: > Create a new Advanced database
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain('→ Configure Leader Pool')
      expect(createAddonStub.calledOnce).to.be.true
      expect(createAddonStub.args[0][0]).to.equal(privateDbAttachment.addon.app.name)
      expect(createAddonStub.args[0][1]).to.equal('heroku-postgresql:advanced-private')
      expect(createAddonStub.args[0][4]).to.deep.include({
        config: {
          from: privateDbAttachment.addon.id,
          'high-availability': true,
          level: '4G-Performance',
        },
      })
    })

    it('creates a database with shield networking for a Shield source database', async function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [asMigration(existentMigrationResponse)],
        sources: [toSource(shieldDbAttachment), toSource(standardDbAttachment)],
        targets: [toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo)],
      }))

      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Shield database
        '\n', // Select target database: > Create a new Advanced database
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain('→ Configure Leader Pool')
      expect(createAddonStub.calledOnce).to.be.true
      expect(createAddonStub.args[0][0]).to.equal(shieldDbAttachment.addon.app.name)
      expect(createAddonStub.args[0][1]).to.equal('heroku-postgresql:advanced-shield')
      expect(createAddonStub.args[0][4]).to.deep.include({
        config: {
          from: shieldDbAttachment.addon.id,
          'high-availability': true,
          level: '4G-Performance',
        },
      })
    })
  })

  describe('start a migration', function () {
    beforeEach(function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [
          asMigration({
            ...existentMigrationResponse,
            status: MigrationStatus.READY,
            status_description: 'Ready to promote',
          }),
          asMigration(createdMigrationResponse),
        ],
        sources: [toSource(standardDbAttachment), toSource(premiumDbAttachment)],
        targets: [
          toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo),
          toTarget(nonTargetAdvancedDbAttachment, {...nonTargetAdvancedDbInfo, status: DatabaseStatus.MIGRATING}),
        ],
      }))
    })

    it('starts the migration', async function () {
      mockedStdinInput = [
        '\n', // Main menu: > Start a migration
        '\n', // Select the migration to start: > first ready migration
        '\n', // Confirm to start migration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(fakeData.postgresMigration.run.calledOnce).to.be.true
      expect(fakeData.postgresMigration.run.firstCall.args[0]).to.equal(targetAdvancedDbAttachment.addon.id)
      expect(stderr).to.equal('Starting migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('shows the expected list of migrations to choose from', async function () {
      mockedStdinInput = [
        '\n', // Main menu: > Start a migration
        '\n', // Select the migration to start: > first ready migration
        '\n', // Confirm to start migration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      const migrationList = stdout.match(/(?<=Select the migration to start: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      // Only the ready migration is offered.
      expect(migrationList).to.contain('From ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345')
      expect(migrationList).not.to.contain('From ⛁ postgresql-convex-12345 to ⛁ postgresql-obscured-12345')
    })

    it('allows the user to navigate back on every step', async function () {
      mockedStdinInput = [
        '\n',         // Main menu: > Start a migration
        '\n',         // Select the migration to start: > first ready migration
        '\u001B[A\n', // Confirm to start migration: > Go back
        '\n',         // Select the migration to start: > first ready migration
        '\n',         // Confirm to start migration: > Confirm
        EXIT,         // Main menu: > Exit
      ]

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stdout.match(/Select the migration to start: \(Use arrow keys\)/g)?.length).to.equal(2)
      expect(stdout.match(/Confirm to start migration: \(Use arrow keys\)/g)?.length).to.equal(2)
    })
  })

  describe('cancel a migration', function () {
    beforeEach(function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        migrations: [
          asMigration({
            ...existentMigrationResponse,
            status: MigrationStatus.READY,
            status_description: 'Ready to promote',
          }),
          asMigration(createdMigrationResponse),
        ],
        sources: [toSource(standardDbAttachment), toSource(premiumDbAttachment)],
        targets: [
          toTarget(targetAdvancedDbAttachment, targetAdvancedDbInfo),
          toTarget(nonTargetAdvancedDbAttachment, {...nonTargetAdvancedDbInfo, status: DatabaseStatus.MIGRATING}),
        ],
      }))
    })

    it('cancels the migration', async function () {
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Cancel a migration (down from Start)
        '\n',         // Select the migration to cancel: > first ready migration
        '\n',         // Confirm to cancel migration: > Confirm
        EXIT,         // Main menu: > Exit
      ]

      const {stderr} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(fakeData.postgresMigration.cancel.calledOnce).to.be.true
      expect(fakeData.postgresMigration.cancel.firstCall.args[0]).to.equal(targetAdvancedDbAttachment.addon.id)
      expect(stderr).to.equal('Canceling migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('shows the expected list of migrations to choose from', async function () {
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Cancel a migration (down from Start)
        '\n',         // Select the migration to cancel: > first ready migration
        '\n',         // Confirm to cancel migration: > Confirm
        EXIT,         // Main menu: > Exit
      ]

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      const migrationList = stdout.match(/(?<=Select the migration to cancel: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(migrationList).to.contain('From ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345')
      expect(migrationList).not.to.contain('From ⛁ postgresql-convex-12345 to ⛁ postgresql-obscured-12345')
    })

    it('allows the user to navigate back on every step', async function () {
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Cancel a migration (down from Start)
        '\n',         // Select the migration to cancel: > first ready migration
        '\u001B[A\n', // Confirm to cancel migration: > Go back
        '\n',         // Select the migration to cancel: > first ready migration
        '\n',         // Confirm to cancel migration: > Confirm
        EXIT,         // Main menu: > Exit
      ]

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stdout.match(/Select the migration to cancel: \(Use arrow keys\)/g)?.length).to.equal(2)
      expect(stdout.match(/Confirm to cancel migration: \(Use arrow keys\)/g)?.length).to.equal(2)
    })
  })

  describe('interactive migration method selection', function () {
    beforeEach(function () {
      fakeData.postgresMigration.listMigrationContext.resolves(migrationContext({
        sources: [toSource(premiumDbAttachment)],
        targets: [toTarget(nonTargetAdvancedDbAttachment, nonTargetAdvancedDbInfo)],
      }))
    })

    it('allows the user to select the snapshot migration method', async function () {
      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Select the migration method: > Snapshot (first option)
        '\n', // Confirm migration configuration: > Confirm
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'full-load',
        source_id: premiumDbAttachment.addon.id,
      })
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.match(/Select the migration method: Snapshot/)
    })

    it('allows the user to select the cdc streaming migration method', async function () {
      mockedStdinInput = [
        '\n',         // Main menu: > Configure a database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\u001B[B\n', // Select the migration method: > Streaming (down from Snapshot)
        '\n',         // Confirm migration configuration: > Confirm
        EXIT,         // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'cdc',
        source_id: premiumDbAttachment.addon.id,
      })
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.match(/Select the migration method: Streaming/)
    })

    it('allows the user to go back from method selection to target selection', async function () {
      mockedStdinInput = [
        '\n',         // Main menu: > Configure a database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\u001B[A\n', // Select the migration method: > Go back
        '\u001B[A\n', // Select target database: > Go back
        '\u001B[A\n', // Select source database: > Go back (exits configure)
        EXIT,         // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(fakeData.postgresMigration.create.called).to.be.false
      expect(stderr).to.equal('')
      expect(stdout).to.match(/Select the migration method: Go back/)
    })

    it('prompts for the migration method again after going back from confirmation', async function () {
      mockedStdinInput = [
        '\n',         // Main menu: > Configure a database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\u001B[B\n', // Select the migration method: > Streaming (first pass)
        '\u001B[A\n', // Confirm migration configuration: > Go back
        '\n',         // Select the migration method: > Snapshot (second pass)
        '\n',         // Confirm migration configuration: > Confirm
        EXIT,         // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('Configuring migration... done\n')
      // The method prompt is presented on both passes, not skipped the second
      // time. The "(Use arrow keys)" hint renders only on a prompt's first paint,
      // so counting it yields one match per distinct method prompt.
      expect(stdout.match(/Select the migration method: \(Use arrow keys\)/g)?.length).to.equal(2)
      // The second selection (snapshot -> full-load) is what gets submitted.
      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'full-load',
        source_id: premiumDbAttachment.addon.id,
      })
    })

    it('skips the method selection prompt when --method=snapshot is provided', async function () {
      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm (no method prompt)
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'full-load',
        source_id: premiumDbAttachment.addon.id,
      })
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).not.to.contain('Select the migration method')
    })

    it('skips the method selection prompt when --method=streaming is provided', async function () {
      mockedStdinInput = [
        '\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm (no method prompt)
        EXIT, // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=streaming'])

      expect(fakeData.postgresMigration.create.firstCall.args[1]).to.deep.equal({
        method: 'cdc',
        source_id: premiumDbAttachment.addon.id,
      })
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).not.to.contain('Select the migration method')
    })
  })
})
