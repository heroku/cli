/* eslint-disable import/no-named-as-default-member */
import * as Heroku from '@heroku-cli/schema'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import inquirer from 'inquirer'
import mockStdin from 'mock-stdin'
import nock from 'nock'
import sinon from 'sinon'

import DataPgMigrate from '../../../../../src/commands/data/pg/migrate.js'
import PoolConfig from '../../../../../src/lib/data/pool-config.js'
import {DatabaseStatus, MigrationResponse, MigrationStatus} from '../../../../../src/lib/data/types.js'
import {clearLevelsAndPricingCache} from '../../../../../src/lib/data/utils.js'
import {
  createdMigrationResponse,
  essentialDbAttachment,
  existentMigrationResponse,
  foreignAdvancedDbAttachment,
  foreignStandardDbAttachment,
  levelsResponse,
  nonPostgresAddonAttachment,
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

// Replies to the requests each refresh makes for the target Advanced database
function replyWithTargetMigration(dataApi: nock.Scope, migration: Partial<MigrationResponse>, times = 1): nock.Scope {
  return dataApi
    .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
    .times(times)
    .reply(200, {...existentMigrationResponse, ...migration})
    .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
    .times(times)
    .reply(200, targetAdvancedDbInfo)
}

describe('data:pg:migrate', function () {
  let createAddonStub: sinon.SinonStub
  let mockedStdinInput: string[] = []
  let poolConfigLeaderInteractiveConfigStub: sinon.SinonStub
  let stdin: mockStdin.MockSTDIN

  beforeEach(function () {
    createAddonStub = sinon.stub(DataPgMigrate.prototype, 'createAddon')
    poolConfigLeaderInteractiveConfigStub = sinon.stub(PoolConfig.prototype, 'leaderInteractiveConfig')
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
  })

  describe('main menu loop, without configured migrations', function () {
    it('hides the table output and shows the no migrations message', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [])

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).not.to.match(/Source Database\s+Destination Database\s+Method\s+Status/)
      expect(stdout).to.contain('You haven\'t configured any migrations for ⬢ myapp yet.')
    })

    it('enables configuring a new migration option when there are classic databases owned by the app', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          standardDbAttachment,
        ])

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('Configure a new database migration')
      expect(stdout).not.to.contain('no classic Postgres databases pending migration on ⬢ myapp')
    })

    it('disables configuring a new migration option when there are no classic databases owned by the app', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          foreignStandardDbAttachment,
        ])

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Configure a new database migration (no classic Postgres databases pending migration on ⬢ myapp)')
    })

    it('doesn\'t show any migrations to manage', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).not.to.contain('Manage migration')
    })
  })

  describe('main menu loop, with configured migrations', function () {
    it('shows the configured migrations table', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).not.to.contain('You haven\'t configured any migrations for ⬢ myapp yet.')
      expect(stdout).to.match(/Source Database\s+Destination Database\s+Method\s+Status/)
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Streaming\s+Preparing databases/)
    })

    it('shows an option to manage each configured migration', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.match(/⛁ postgresql-convex-12345\s+⛁ postgresql-obscured-12345\s+Snapshot\s+Preparing databases/)
      expect(stdout).to.contain('Manage migration from ⛁ postgresql-convex-12345 to ⛁ postgresql-obscured-12345')
      expect(stdout).to.contain('Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345')
    })

    it('accepts the --no-wrap flag and renders the migrations table', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)

      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--no-wrap'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Streaming\s+Preparing databases/)
    })

    it('shows the status description in place of the status when present', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...existentMigrationResponse,
          status: MigrationStatus.MIGRATING,
          status_description: 'syncing',
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)

      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Streaming\s+syncing/)
      expect(stdout).not.to.contain('Migrating')
    })

    it('re-fetches and re-renders the view when Refresh is selected', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...existentMigrationResponse,
          status: MigrationStatus.PREPARING,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...existentMigrationResponse,
          status: MigrationStatus.MIGRATING,
          status_description: 'Migrating data',
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)

      mockedStdinInput = ['\u001B[A\u001B[A\n', '\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('Refresh')
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Streaming\s+Preparing databases/)
      expect(stdout).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Streaming\s+Migrating data/)
    })

    it('disables configuring a new migration option when there are no additional classic databases pending migration', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Configure a new database migration (no classic Postgres databases pending migration on ⬢ myapp)')
    })

    it('keeps the databases of a migration that is being canceled from new migrations', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = replyWithTargetMigration(nock('https://api.data.heroku.com'), {status: MigrationStatus.CANCELLING})

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Configure a new database migration (no classic Postgres databases pending migration on ⬢ myapp)')
    })

    it('enables configuring a new migration option when there are additional classic databases pending migration', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          premiumDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('Configure a new database migration')
      expect(stdout).not.to.contain('no classic Postgres databases pending migration on ⬢ myapp')
    })
  })

  describe('manage a migration', function () {
    let herokuApi: nock.Scope
    let dataApi: nock.Scope

    beforeEach(function () {
      herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      dataApi = nock('https://api.data.heroku.com')
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('shows the migration details', async function () {
      dataApi
        .get(`/client/v11/databases/${standardDbAttachment.addon.id}`)
        .times(2)
        .reply(200, {info: [{name: 'Status', values: ['Available']}], postgres_version: '16.4'})
      replyWithTargetMigration(dataApi, {}, 2)

      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('=== Migration details')
      expect(stdout).to.match(/Source:\s+⛁ postgresql-cubic-12345 \(STANDARD_DB\) - Postgres 16\.4 - Available/)
      expect(stdout).to.match(/Destination:\s+⛁ postgresql-lively-12345 \(ADVANCED_DB\) - Postgres 17\.5 - Migrating/)
      expect(stdout).to.match(/Method:\s+Streaming/)
      expect(stdout).to.match(/Migration configured at:\s+2026-10-21 16:00 UTC/)
      expect(stdout).to.match(/Status:\s+Preparing databases/)
    })

    it('only enables canceling a migration that is being prepared or running', async function () {
      const startReasons = [
        {startReason: 'the migration is being prepared', status: MigrationStatus.CREATING_TARGET},
        {startReason: 'the migration is being prepared', status: MigrationStatus.PREPARING},
        {startReason: 'the migration is running', status: MigrationStatus.MIGRATING},
      ]

      for (const {startReason, status} of startReasons) {
        replyWithTargetMigration(dataApi, {status}, 2)
        mockedStdinInput = [
          '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
          '\u001B[A\n', // Manage migration: > Go back
          '\u001B[A\n', // Main menu: > Exit
        ]

        // eslint-disable-next-line no-await-in-loop
        const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

        dataApi.done()
        expect(error).to.be.undefined
        expect(stderr).to.equal('')
        expect(stdout).to.contain(`- Start the migration (${startReason})`)
        expect(stdout).to.contain('Cancel the migration')
        expect(stdout).not.to.contain('- Cancel the migration (')
      }
    })

    it('enables starting and canceling a ready migration', async function () {
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'}, 2)

      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('Start the migration')
      expect(stdout).to.contain('Cancel the migration')
      expect(stdout).not.to.contain('- Start the migration (')
      expect(stdout).not.to.contain('- Cancel the migration (')
    })

    it('disables starting a migration that is promoting, being canceled or ended', async function () {
      const startReasons = [
        {startReason: 'the migration was canceled', status: MigrationStatus.CANCELLED},
        {startReason: 'the migration is being canceled', status: MigrationStatus.CANCELLING},
        {startReason: 'the migration completed successfully', status: MigrationStatus.COMPLETED},
        {startReason: 'the migration failed', status: MigrationStatus.FAILED},
        {startReason: 'the migration is running', status: MigrationStatus.PROMOTING},
        // Other statuses don't explain why
        {startReason: 'Disabled', status: 'assessment_completed' as MigrationStatus},
        {startReason: 'Disabled', status: MigrationStatus.UNKNOWN},
      ]

      for (const {startReason, status} of startReasons) {
        replyWithTargetMigration(dataApi, {can_cancel: false, status}, 2)
        mockedStdinInput = [
          '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
          '\u001B[A\n', // Manage migration: > Go back
          '\u001B[A\n', // Main menu: > Exit
        ]

        // eslint-disable-next-line no-await-in-loop
        const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

        dataApi.done()
        expect(error).to.be.undefined
        expect(stderr).to.equal('')
        expect(stdout).to.contain(`- Start the migration (${startReason})`)
      }
    })

    it('shows why the API doesn\'t allow canceling a migration', async function () {
      replyWithTargetMigration(dataApi, {
        can_cancel: false,
        cancel_disabled_reason: 'the migration is promoting',
        status: MigrationStatus.PROMOTING,
      }, 2)
      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Cancel the migration (the migration is promoting)')
    })

    it('disables canceling a migration when the API doesn\'t allow it or explain why', async function () {
      replyWithTargetMigration(dataApi, {can_cancel: false, status: MigrationStatus.MIGRATING}, 2)
      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.contain('- Cancel the migration (Disabled)')
    })

    it('refreshes the migration details when Refresh is selected', async function () {
      replyWithTargetMigration(dataApi, {})
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'}, 2)

      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\n',         // Manage migration: > Refresh migration details
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout.match(/=== Migration details/g)?.length).to.equal(2)
      expect(stdout).to.match(/Status:\s+Preparing databases/)
      expect(stdout).to.match(/Status:\s+Ready to promote/)
    })

    it('goes back to the main menu when a newer migration replaces the migration', async function () {
      replyWithTargetMigration(dataApi, {})
      replyWithTargetMigration(dataApi, {id: 'a6d41b1c-3d3e-4ad5-a7a1-ef2d0ad09d6f'}, 2)

      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\n',         // Manage migration: > Refresh migration details
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout.match(/=== Migration details/g)?.length).to.equal(1)
      expect(stdout).to.contain('The migration is no longer available. Either a newer migration replaced it or its destination database was removed.')
    })

    it('omits the migration details that aren\'t available', async function () {
      dataApi
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, {...existentMigrationResponse, created_at: undefined, migration_strategy: null})
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(404, {id: 'not_found', message: 'Not found.'})

      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.match(/Destination:\s+⛁ postgresql-lively-12345 \(ADVANCED_DB\)$/m)
      expect(stdout).not.to.contain('Method:')
      expect(stdout).not.to.contain('Migration configured at:')
      expect(stdout).to.match(/Status:\s+Preparing databases/)
    })
  })

  describe('configure a database migration with an existing candidate target database for the migration', function () {
    let herokuApi: nock.Scope
    let dataApi: nock.Scope

    beforeEach(async function () {
      herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          essentialDbAttachment,
          foreignAdvancedDbAttachment,
          foreignStandardDbAttachment,
          nonPostgresAddonAttachment,
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
          standardDbAttachment,
          targetAdvancedDbAttachment,
          unavailableAdvancedDbAttachment,
        ])
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${unavailableAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .get(`/data/postgres/v1/${unavailableAdvancedDbAttachment.addon.id}/info`)
        .reply(200, unavailableAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        // The migration details and then the main menu refresh after configuring the migration
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${unavailableAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)
        .get(`/data/postgres/v1/${unavailableAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, unavailableAdvancedDbInfo)
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('creates a new migration configuration when confirmed', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      // Verify the confirmation message is shown
      expect(stdout).to.contain('By continuing, we prepare the necessary steps for the migration.')
      expect(stdout).to.contain('Preparing the migration deletes all the data on the destination database ⛁ postgresql-obscured-12345.')
      expect(stderr).to.equal('Configuring migration... done\n')
      // Verify the details of the new migration are shown
      expect(stdout).to.match(/Source:\s+⛁ postgresql-convex-12345 \(PREMIUM_DB\)/)
      expect(stdout).to.match(/Destination:\s+⛁ postgresql-obscured-12345 \(OTHER_ADVANCED_DB\) - Postgres 17\.5 - Available/)
      expect(stdout).to.match(/Migration configured at:\s+2026-10-21 17:30 UTC/)
      // Verify the new migration is shown on the configured migrations table
      expect(stdout).to.match(/⛁ postgresql-convex-12345\s+⛁ postgresql-obscured-12345\s+Snapshot\s+Preparing databases/)
    })

    it('shows the expected list of source databases', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      const sourceDatabaseList = stdout.match(/(?<=Select the source database: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(stderr).to.equal('Configuring migration... done\n')
      // Entry for the source database that is already a migration source should be disabled
      expect(sourceDatabaseList).to.contain(`⛁ ${standardDbAttachment.addon.name} as STANDARD_DB (already a source database for an active migration)`)
      // Entry for the Premium database should be enabled
      expect(sourceDatabaseList).to.contain(`⛁ ${premiumDbAttachment.addon.name} as PREMIUM_DB`)
      expect(sourceDatabaseList).not.to.contain(`⛁ ${premiumDbAttachment.addon.name} as PREMIUM_DB (already a source database for an active migration)`)
      // There should be no entry for the Essential database
      expect(sourceDatabaseList).not.to.contain(essentialDbAttachment.addon.name)
      // There should be no entry for the Foreign standard database
      expect(sourceDatabaseList).not.to.contain(foreignStandardDbAttachment.addon.name)
      // There should be no entry for the Non-Postgres addon
      expect(sourceDatabaseList).not.to.contain(nonPostgresAddonAttachment.addon.name)
      // There should be no entry for the Advanced databases
      expect(sourceDatabaseList).not.to.contain(nonTargetAdvancedDbAttachment.addon.name)
      expect(sourceDatabaseList).not.to.contain(foreignAdvancedDbAttachment.addon.name)
      expect(sourceDatabaseList).not.to.contain(targetAdvancedDbAttachment.addon.name)
    })

    it('shows the expected list of target databases', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      const targetDatabaseList = stdout.match(/(?<=Select the destination database: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(stderr).to.equal('Configuring migration... done\n')
      // Entry for the target database that is already a migration destination should be disabled
      expect(targetDatabaseList).to.contain(`⛁ ${targetAdvancedDbAttachment.addon.name} v17.5 as ADVANCED_DB (already a destination database for an active migration)`)
      // Entry for the non-target Advanced database should be enabled
      expect(targetDatabaseList).to.contain(`⛁ ${nonTargetAdvancedDbAttachment.addon.name} v17.5 as OTHER_ADVANCED_DB`)
      expect(targetDatabaseList).not.to.contain(`⛁ ${nonTargetAdvancedDbAttachment.addon.name} v17.5 as OTHER_ADVANCED_DB (already a destination database for an active migration)`)
      // Entry for the unavailable database should be disabled
      expect(targetDatabaseList).to.contain(`⛁ ${unavailableAdvancedDbAttachment.addon.name} v17.5 as UNAVAILABLE_DB (database isn't available)`)
      // There should be no entries for non-Advanced or foreign databases
      expect(targetDatabaseList).not.to.contain(essentialDbAttachment.addon.name)
      expect(targetDatabaseList).not.to.contain(foreignAdvancedDbAttachment.addon.name)
      expect(targetDatabaseList).not.to.contain(foreignStandardDbAttachment.addon.name)
      expect(targetDatabaseList).not.to.contain(premiumDbAttachment.addon.name)
      expect(targetDatabaseList).not.to.contain(standardDbAttachment.addon.name)
      // There should be no entry for the non-Postgres addon
      expect(targetDatabaseList).not.to.contain(nonPostgresAddonAttachment.addon.name)
    })

    it('allows the user to navigate back on every step', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\u001B[A\n', // Confirm migration configuration: > Go back
        '\u001B[A\n', // Select target database: > Go back
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout.match(/Select the source database: \(Use arrow keys\)/g)?.length).to.equal(2)
      expect(stdout.match(/Select the destination database: \(Use arrow keys\)/g)?.length).to.equal(3)
      expect(stdout.match(/Confirm migration configuration: \(Use arrow keys\)/g)?.length).to.equal(2)
    })
  })

  describe('configure a database migration with a provisioning target database', function () {
    it('allows selecting a target database that is still provisioning', async function () {
      const provisioningAdvancedDbInfo = {...nonTargetAdvancedDbInfo, status: DatabaseStatus.PROVISIONING}
      const herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {id: 'not_found', message: 'Add-on not found'})
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, provisioningAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, provisioningAdvancedDbInfo)

      mockedStdinInput = [
        '\n',         // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Provisioning Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).not.to.contain('database isn\'t available')
    })
  })

  describe('configure a database migration with the hidden --method flag', function () {
    it('sends method=cdc when --method=streaming', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .times(3)
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
          targetAdvancedDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {id: 'not_found', message: 'Add-on not found'})
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'cdc',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=streaming'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
    })

    it('rejects unsupported method values', async function () {
      const {error} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=bogus'])
      expect(error?.message).to.match(/Expected --method=bogus to be one of: snapshot, streaming/)
    })
  })

  describe('configure a database migration with a new target database created for the migration', function () {
    beforeEach(async function () {
      poolConfigLeaderInteractiveConfigStub.resolves({
        action: '__confirm',
        highAvailability: true,
        level: '4G-Performance',
      })
      createAddonStub.resolves(nonTargetAdvancedDbAttachment.addon as unknown as Heroku.AddOn)
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('creates a database without private or shield networking for a non-Private/Shield source database', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          premiumDbAttachment,
          standardDbAttachment,
          targetAdvancedDbAttachment,
        ])
        .get('/apps/myapp/addon-attachments')
        .times(2)
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
          standardDbAttachment,
          targetAdvancedDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Create database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain('→ Configure Leader Pool')
      expect(createAddonStub.calledOnce).to.be.true
      expect(createAddonStub.args[0][1]).to.equal(premiumDbAttachment.addon.app.name)
      // Verify the service plan is correct (no private or shield networking)
      expect(createAddonStub.args[0][2]).to.equal('heroku-postgresql:advanced')
      expect(createAddonStub.args[0][5]).to.deep.include({
        config: {
          'high-availability': true,
          level: '4G-Performance',
        },
      })
    })

    it('creates a database with private networking for a Private source database', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          privateDbAttachment,
          standardDbAttachment,
          targetAdvancedDbAttachment,
        ])
        .get('/apps/myapp/addon-attachments')
        .times(2)
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          privateDbAttachment,
          standardDbAttachment,
          targetAdvancedDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: privateDbAttachment.addon.id,
        })
        .reply(200, {
          ...createdMigrationResponse,
          source_id: privateDbAttachment.addon.id,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, {
          ...createdMigrationResponse,
          source_id: privateDbAttachment.addon.id,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Private database
        '\n',         // Select target database: > Create database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain('→ Configure Leader Pool')
      expect(createAddonStub.calledOnce)
      expect(createAddonStub.args[0][1]).to.equal(privateDbAttachment.addon.app.name)
      // Verify the service plan is correct (private networking)
      expect(createAddonStub.args[0][2]).to.equal('heroku-postgresql:advanced-private')
      expect(createAddonStub.args[0][5]).to.deep.include({
        config: {
          'high-availability': true,
          level: '4G-Performance',
        },
      })
    })

    it('creates a database with shield networking for a Shield source database', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          shieldDbAttachment,
          standardDbAttachment,
          targetAdvancedDbAttachment,
        ])
        .get('/apps/myapp/addon-attachments')
        .times(2)
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          shieldDbAttachment,
          standardDbAttachment,
          targetAdvancedDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: shieldDbAttachment.addon.id,
        })
        .reply(200, {
          ...createdMigrationResponse,
          source_id: shieldDbAttachment.addon.id,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, {
          ...createdMigrationResponse,
          source_id: shieldDbAttachment.addon.id,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Shield database
        '\n',         // Select target database: > Create database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain('→ Configure Leader Pool')
      expect(createAddonStub.calledOnce)
      expect(createAddonStub.args[0][1]).to.equal(shieldDbAttachment.addon.app.name)
      // Verify the service plan is correct (shield networking)
      expect(createAddonStub.args[0][2]).to.equal('heroku-postgresql:advanced-shield')
      expect(createAddonStub.args[0][5]).to.deep.include({
        config: {
          'high-availability': true,
          level: '4G-Performance',
        },
      })
    })
  })

  describe('start a migration', function () {
    let herokuApi: nock.Scope
    let dataApi: nock.Scope

    beforeEach(function () {
      herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      dataApi = nock('https://api.data.heroku.com')
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('starts the migration', async function () {
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'})
      dataApi
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/run`)
        .reply(202, {})
      replyWithTargetMigration(dataApi, {status: MigrationStatus.MIGRATING, status_description: 'Migrating data'}, 2)

      // Simulate the user selections
      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\n', // Manage migration: > Start the migration
        '\n',         // Confirm to start migration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      // Verify the confirmation message is displayed
      expect(stdout).to.contain('Your database ⛁ postgresql-cubic-12345 will be unavailable after starting the migration until the migration is complete.')
      expect(stderr).to.equal('Starting migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
      // Verify the migration details are refreshed after starting the migration
      expect(stdout).to.match(/Status:\s+Migrating data/)
      expect(stdout).to.contain('- Start the migration (the migration is running)')
    })

    it('goes back to the migration details without starting the migration', async function () {
      // Only the main menu refreshes, since going back from the confirmation changes nothing
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'}, 2)

      // Simulate the user selections
      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\n', // Manage migration: > Start the migration
        '\u001B[A\n', // Confirm to start migration: > Go back
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout.match(/Confirm to start migration: \(Use arrow keys\)/g)?.length).to.equal(1)
      expect(stdout.match(/=== Migration details/g)?.length).to.equal(2)
    })
  })

  describe('cancel a migration', function () {
    let herokuApi: nock.Scope
    let dataApi: nock.Scope

    beforeEach(function () {
      herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      dataApi = nock('https://api.data.heroku.com')
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('cancels a ready migration', async function () {
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'})
      dataApi
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/cancel`)
        .reply(202, {})
      replyWithTargetMigration(dataApi, {
        can_cancel: false,
        cancel_disabled_reason: 'the migration is already being canceled',
        status: MigrationStatus.CANCELLING,
        status_description: 'Canceling migration. You can start a new migration once this finishes.',
      }, 2)

      // Simulate the user selections
      mockedStdinInput = [
        '\n',                 // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\u001B[B\n', // Manage migration: > Cancel the migration
        '\n',                 // Confirm to cancel migration: > Confirm
        '\u001B[A\n',         // Manage migration: > Go back
        '\u001B[A\n',         // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      // Verify the confirmation message is displayed
      expect(stdout).to.contain('After canceling, you must create a new migration configuration')
      expect(stdout).not.to.contain('Canceling stops the running migration')
      expect(stderr).to.equal('Canceling migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
      // Verify the migration details are refreshed after canceling the migration
      expect(stdout).to.match(/Status:\s+Canceling migration\. You can start a new migration once this finishes\./)
      expect(stdout).to.contain('- Start the migration (the migration is being canceled)')
      expect(stdout).to.contain('- Cancel the migration (the migration is already being canceled)')
    })

    it('cancels a running migration', async function () {
      replyWithTargetMigration(dataApi, {status: MigrationStatus.MIGRATING, status_description: 'Migrating data'})
      dataApi
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/cancel`)
        .reply(202, {})
      replyWithTargetMigration(dataApi, {
        can_cancel: false,
        cancel_disabled_reason: 'the migration is already being canceled',
        status: MigrationStatus.CANCELLING,
        status_description: 'Canceling migration. You can start a new migration once this finishes.',
      }, 2)

      // Simulate the user selections
      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\n', // Manage migration: > Cancel the migration
        '\n',         // Confirm to cancel migration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      // Verify the running migration confirmation message is displayed
      expect(stdout).to.contain('Canceling stops the running migration and makes ⛁ postgresql-cubic-12345 available again.')
      expect(stdout).to.contain('You\'ll receive an email when ⛁ postgresql-cubic-12345 is available.')
      expect(stdout).to.contain('After canceling, you must create a new migration configuration')
      expect(stderr).to.equal('Canceling migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
      expect(stdout).to.match(/Status:\s+Canceling migration\. You can start a new migration once this finishes\./)
    })

    it('cancels a migration that is being prepared', async function () {
      replyWithTargetMigration(dataApi, {status: MigrationStatus.PREPARING})
      dataApi
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/cancel`)
        .reply(202, {})
      replyWithTargetMigration(dataApi, {
        can_cancel: false,
        cancel_disabled_reason: 'the migration is already being canceled',
        status: MigrationStatus.CANCELLING,
        status_description: 'Canceling migration. You can start a new migration once this finishes.',
      }, 2)

      // Simulate the user selections
      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\n', // Manage migration: > Cancel the migration
        '\n',         // Confirm to cancel migration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('Canceling migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('shows the API error when canceling the migration fails', async function () {
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'})
      dataApi
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/cancel`)
        .reply(422, {id: 'unprocessable_entity', message: 'Cannot cancel migration in current state'})

      // Simulate the user selections
      mockedStdinInput = [
        '\n',                 // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\u001B[B\n', // Manage migration: > Cancel the migration
        '\n',                 // Confirm to cancel migration: > Confirm
      ]

      const {error} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error?.message).to.contain('Cannot cancel migration in current state')
    })

    it('goes back to the migration details without canceling the migration', async function () {
      // Only the main menu refreshes, since going back from the confirmation changes nothing
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'}, 2)

      // Simulate the user selections
      mockedStdinInput = [
        '\n',                 // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\u001B[B\n', // Manage migration: > Cancel the migration
        '\u001B[A\n',         // Confirm to cancel migration: > Go back
        '\u001B[A\n',         // Manage migration: > Go back
        '\u001B[A\n',         // Main menu: > Exit
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout.match(/Confirm to cancel migration: \(Use arrow keys\)/g)?.length).to.equal(1)
      expect(stdout.match(/=== Migration details/g)?.length).to.equal(2)
    })
  })

  describe('interactive migration method selection', function () {
    let herokuApi: nock.Scope
    let dataApi: nock.Scope

    beforeEach(function () {
      herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
        ])
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('allows user to select snapshot migration method', async function () {
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',  // Select configure migration
        '\n',  // Select source database
        '\n',  // Select target database
        '\n',  // Select snapshot method (first option, default)
        '\n',  // Confirm migration
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.match(/Select the migration method: Snapshot/)
    })

    it('allows user to select cdc streaming migration method', async function () {
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'cdc',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',          // Select configure migration
        '\n',          // Select source database
        '\n',          // Select target database
        '\u001B[B\n',  // Select streaming option from method selection
        '\n',          // Confirm migration
        '\u001B[A\n',  // Manage migration: > Go back
        '\u001B[A\n',  // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.match(/Select the migration method: Streaming/)
    })

    it('allows user to go back from method selection to target selection', async function () {
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',          // Select configure migration
        '\n',          // Select source database
        '\n',          // Select target database
        '\u001B[A\n',  // Navigate down twice to "Go back", press Enter
        '\u001B[A\n',  // Go back from target selection
        '\u001B[A\n',  // Go back from source selection
        '\u001B[A\n',  // Exit from main menu
      ]

      const {error, stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.be.undefined
      expect(stderr).to.equal('')
      expect(stdout).to.match(/Select the migration method: Go back/)
    })

    it('prompts for the migration method again after going back from confirmation', async function () {
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',          // Select configure migration
        '\n',          // Select source database
        '\n',          // Select target database
        '\u001B[B\n',  // Select streaming method (first selection)
        '\u001B[A\n',  // Confirm migration configuration: > Go back
        '\n',          // Select snapshot method (second selection, default)
        '\n',          // Confirm migration
        '\u001B[A\n',  // Manage migration: > Go back
        '\u001B[A\n',  // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      // The method prompt must be presented twice (once per pass), not skipped on
      // the second pass. The "(Use arrow keys)" hint renders only on a prompt's
      // first paint, so counting it yields one match per distinct prompt display.
      expect(stdout.match(/Select the migration method: \(Use arrow keys\)/g)?.length).to.equal(2)
      // The second selection (snapshot -> full-load) must be what gets submitted,
      // which is asserted by the nock POST body matcher above requiring method=full-load
    })

    it('skips method selection prompt when --method=snapshot flag is provided', async function () {
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',  // Select configure migration
        '\n',  // Select source database
        '\n',  // Select target database
        '\n',  // Confirm migration (no method selection prompt)
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, [
        '--app=myapp',
        '--method=snapshot',
      ])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).not.to.contain('Select the migration method')
    })

    it('skips method selection prompt when --method=streaming flag is provided', async function () {
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {
          id: 'not_found',
          message: 'Add-on not found',
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'cdc',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',  // Select configure migration
        '\n',  // Select source database
        '\n',  // Select target database
        '\n',  // Confirm migration (no method selection prompt)
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, [
        '--app=myapp',
        '--method=streaming',
      ])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).not.to.contain('Select migration method')
    })
  })

  describe('Postgres versions', function () {
    afterEach(function () {
      nock.cleanAll()
    })

    it('shows the database versions and warns about a major version change when configuring a migration', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/client/v11/databases/${premiumDbAttachment.addon.id}`)
        .times(3)
        .reply(200, {postgres_version: '16.4'})
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {id: 'not_found', message: 'Add-on not found'})
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',         // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain(`⛁ ${premiumDbAttachment.addon.name} v16.4 as PREMIUM_DB`)
      expect(stdout).to.contain(`⛁ ${nonTargetAdvancedDbAttachment.addon.name} v17.5 as OTHER_ADVANCED_DB`)
      expect(stdout).to.contain('Warning: The destination database runs Postgres 17.5, but the source database runs Postgres 16.4.')
      expect(stdout).to.match(/Source:\s+⛁ postgresql-convex-12345 \(PREMIUM_DB\) - Postgres 16\.4$/m)
      expect(stdout).to.match(/Destination:\s+⛁ postgresql-obscured-12345 \(OTHER_ADVANCED_DB\) - Postgres 17\.5 - Available/)
    })

    it('does not warn about a version change when the major versions match', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/client/v11/databases/${premiumDbAttachment.addon.id}`)
        .times(3)
        .reply(200, {postgres_version: '17.2'})
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(404, {id: 'not_found', message: 'Add-on not found'})
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',         // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain(`⛁ ${premiumDbAttachment.addon.name} v17.2 as PREMIUM_DB`)
      expect(stdout).not.to.contain('The destination database runs Postgres')
    })

    it('provisions a new destination database on the source database major version', async function () {
      poolConfigLeaderInteractiveConfigStub.resolves({
        action: '__confirm',
        highAvailability: true,
        level: '4G-Performance',
      })
      createAddonStub.resolves(nonTargetAdvancedDbAttachment.addon as unknown as Heroku.AddOn)
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          premiumDbAttachment,
        ])
        .get('/apps/myapp/addon-attachments')
        .times(2)
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/client/v11/databases/${premiumDbAttachment.addon.id}`)
        .times(3)
        .reply(200, {postgres_version: '16.4'})
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
        .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
          method: 'full-load',
          source_id: premiumDbAttachment.addon.id,
        })
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .times(2)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',         // Main menu: > Configure a new database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Create database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(createAddonStub.calledOnce).to.be.true
      expect(createAddonStub.args[0][5]).to.deep.include({
        config: {
          'high-availability': true,
          level: '4G-Performance',
          version: '16',
        },
      })
      expect(stdout).not.to.contain('The destination database runs Postgres')
    })

    it('warns about a major version change when starting a migration', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
        .get(`/client/v11/databases/${standardDbAttachment.addon.id}`)
        .times(3)
        .reply(200, {postgres_version: '16.4'})
      replyWithTargetMigration(dataApi, {status: MigrationStatus.READY, status_description: 'Ready to promote'})
      dataApi
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/run`)
        .reply(202, {})
      replyWithTargetMigration(dataApi, {status: MigrationStatus.MIGRATING}, 2)

      mockedStdinInput = [
        '\n',         // Main menu: > Manage migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345
        '\u001B[B\n', // Manage migration: > Start the migration
        '\n',         // Confirm to start migration: > Confirm
        '\u001B[A\n', // Manage migration: > Go back
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr).to.equal('Starting migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
      expect(stdout).to.match(/Source:\s+⛁ postgresql-cubic-12345 \(STANDARD_DB\) - Postgres 16\.4$/m)
      expect(stdout).to.contain('Warning: The destination database runs Postgres 17.5, but the source database runs Postgres 16.4.')
    })
  })
})
