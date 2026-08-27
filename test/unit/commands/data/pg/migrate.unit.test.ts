/* eslint-disable import/no-named-as-default-member */
import * as Heroku from '@heroku-cli/schema'
import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import inquirer from 'inquirer'
import mockStdin from 'mock-stdin'
import nock from 'nock'
import sinon from 'sinon'

import DataPgMigrate from '../../../../../src/commands/data/pg/migrate.js'
import PoolConfig from '../../../../../src/lib/data/pool-config.js'
import {MigrationSourceStatus, MigrationStatus} from '../../../../../src/lib/data/types.js'
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
  snapshotMigrationResponse,
  standardDbAttachment,
  streamingMigrationResponse,
  targetAdvancedDbAttachment,
  targetAdvancedDbInfo,
  unavailableAdvancedDbAttachment,
  unavailableAdvancedDbInfo,
} from '../../../../fixtures/data/pg/fixtures.js'

const {prompt} = inquirer

describe('data:pg:migrate', function () {
  let createAddonStub: sinon.SinonStub
  let mockedStdinInput: string[] = []
  let poolConfigLeaderInteractiveConfigStub: sinon.SinonStub
  let promptStub: sinon.SinonStub
  let stdin: mockStdin.MockSTDIN

  beforeEach(function () {
    createAddonStub = sinon.stub(DataPgMigrate.prototype, 'createAddon')
    poolConfigLeaderInteractiveConfigStub = sinon.stub(PoolConfig.prototype, 'leaderInteractiveConfig')
    stdin = mockStdin.stdin()
    promptStub = sinon.stub(DataPgMigrate.prototype, 'prompt').callsFake(async (...args: Parameters<typeof prompt>) => {
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

  describe('migration list and details', function () {
    const migrationPath = `/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`

    function mockMigrationState(migration = existentMigrationResponse, times = 1): {dataApi: nock.Scope, herokuApi: nock.Scope} {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .times(times)
        .reply(200, [targetAdvancedDbAttachment, standardDbAttachment])
      const dataApi = nock('https://api.data.heroku.com')
        .get(migrationPath)
        .times(times)
        .reply(200, migration)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(times)
        .reply(200, targetAdvancedDbInfo)

      return {dataApi, herokuApi}
    }

    it('shows useful no-migrations copy and Configure, Refresh, and Exit choices', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [])
      promptStub.resetBehavior()
      promptStub.resolves({action: '__exit'})

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      expect(stderr).to.equal('')
      expect(stdout).to.contain('You haven\'t configured any migrations for ⬢ myapp yet.')
      const {choices} = promptStub.firstCall.args[0]
      expect(choices.map((choice: {name?: string}) => ansis.strip(choice.name ?? '')).filter(Boolean)).to.deep.equal([
        'Configure a new migration',
        'Refresh',
        'Exit',
      ])
      expect(choices[0].disabled).to.contain('no classic Postgres databases pending migration')
    })

    it('presents migrations as selectable one-line summaries before main actions', async function () {
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      promptStub.resetBehavior()
      promptStub.resolves({action: '__exit'})

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      const {choices} = promptStub.firstCall.args[0]
      expect(ansis.strip(choices[0].name)).to.equal('⛁ postgresql-cubic-12345 -> ⛁ postgresql-lively-12345 | Snapshot | Ready to copy data')
      expect(choices[0].value).to.equal(snapshotMigrationResponse.id)
      expect(ansis.strip(choices[1].name)).to.equal('Configure a new migration')
      expect(choices[2].name).to.equal('Refresh')
    })

    it('refreshes the main migration list', async function () {
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse, 2)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: '__refresh'})
      promptStub.onSecondCall().resolves({action: '__exit'})

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(promptStub.callCount).to.equal(2)
    })

    it('does not infer Start and Cancel actions from READY', async function () {
      const readyMigration = {...existentMigrationResponse, status: MigrationStatus.READY}
      const {dataApi, herokuApi} = mockMigrationState(readyMigration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: readyMigration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Method:\s+Unknown/)
      expect(stdout).to.match(/Status:\s+Ready/)
      const detailChoices = promptStub.secondCall.args[0].choices
      expect(detailChoices.map((choice: {name?: string}) => choice.name).filter(Boolean)).to.deep.equal([
        'Watch status',
        'Refresh status',
        'Back to migrations',
        'Exit',
      ])
    })

    it('shows Snapshot details and starts data copy using the run route', async function () {
      const migratingMigration = {
        ...snapshotMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.MIGRATING,
        status_description: 'Data migration in progress',
      }
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      dataApi.post(`${migrationPath}/run`).reply(202, migratingMigration)
      promptStub.resetBehavior()
      promptStub.onCall(0).resolves({action: snapshotMigrationResponse.id})
      promptStub.onCall(1).resolves({action: '__start_migration'})
      promptStub.onCall(2).resolves({action: '__confirm'})
      promptStub.onCall(3).resolves({action: '__exit'})

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Method:\s+Snapshot/)
      expect(stdout).to.match(/Status:\s+Ready to copy data/)
      expect(stdout).not.to.contain('Data copy progress:')
      expect(promptStub.secondCall.args[0].pageSize).to.equal(promptStub.secondCall.args[0].choices.length)
      expect(stdout).to.contain('Starting data copy makes your source database ⛁ postgresql-cubic-12345 unavailable')
      expect(stdout).to.match(/Status:\s+Data migration in progress/)
      expect(promptStub.getCall(3).args[0].message).to.equal('What do you want to do?:')
      expect(stderr).to.equal('Starting data copy from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('shows Streaming details and starts cutover using the run route', async function () {
      const migratingMigration = {
        ...streamingMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.MIGRATING,
        status_description: 'Cutover in progress',
      }
      const {dataApi, herokuApi} = mockMigrationState(streamingMigrationResponse)
      dataApi.post(`${migrationPath}/run`).reply(202, migratingMigration)
      promptStub.resetBehavior()
      promptStub.onCall(0).resolves({action: streamingMigrationResponse.id})
      promptStub.onCall(1).resolves({action: '__start_migration'})
      promptStub.onCall(2).resolves({action: '__confirm'})
      promptStub.onCall(3).resolves({action: '__exit'})

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Method:\s+Streaming/)
      expect(stdout).to.match(/Status:\s+Streaming changes; ready to start cutover: 3s replication lag/)
      expect(stdout).not.to.contain('Replication lag:')
      expect(stdout).to.contain('Starting cutover requests the migration to wait for replication to catch up')
      expect(stdout).to.contain('Writers must remain stopped until cutover is complete.')
      expect(stdout).to.match(/Status:\s+Cutover in progress/)
      expect(promptStub.getCall(3).args[0].message).to.equal('What do you want to do?:')
      expect(stderr).to.equal('Starting cutover from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('cancels a migration using the cancel route', async function () {
      const cancellingMigration = {
        ...snapshotMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.CANCELLING,
        status_description: 'Restoring source database access',
      }
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      dataApi.post(`${migrationPath}/cancel`).reply(202, cancellingMigration)
      promptStub.resetBehavior()
      promptStub.onCall(0).resolves({action: snapshotMigrationResponse.id})
      promptStub.onCall(1).resolves({action: '__cancel_migration'})
      promptStub.onCall(2).resolves({action: '__confirm'})
      promptStub.onCall(3).resolves({action: '__exit'})

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.contain('After canceling, you must create a new migration configuration')
      expect(stdout).to.match(/Status:\s+Restoring source database access/)
      expect(promptStub.getCall(3).args[0].message).to.equal('What do you want to do?:')
      expect(stderr).to.equal('Canceling migration from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('omits mutation actions when enhanced capabilities are false', async function () {
      const migration = {...snapshotMigrationResponse, can_cancel: false, can_start: false}
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      const detailChoices = promptStub.secondCall.args[0].choices
      expect(detailChoices.map((choice: {name?: string}) => choice.name).filter(Boolean)).to.deep.equal([
        'Watch status',
        'Refresh status',
        'Back to migrations',
        'Exit',
      ])
    })

    it('refreshes only the selected migration when Watch status is used without a TTY', async function () {
      const updatedMigration = {
        ...snapshotMigrationResponse,
        full_load_progress: 64,
        status_description: 'Copying data',
      }
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      dataApi.get(migrationPath).reply(200, updatedMigration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: snapshotMigrationResponse.id})
      promptStub.onSecondCall().resolves({action: '__watch'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Status:\s+Copying data/)
      expect(stdout).not.to.contain('Data copy progress:')
      expect(promptStub.thirdCall.args[0].message).to.equal('What do you want to do?:')
    })

    it('continues through intermediate statuses and exits when Start becomes available', async function () {
      const initialMigration = {
        ...snapshotMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.CREATING_TARGET,
        status_description: 'Preparing destination database',
      }
      const preparingMigration = {
        ...initialMigration,
        can_cancel: true,
        status: MigrationStatus.PREPARING,
        status_description: 'Provisioning migration infrastructure',
      }
      const readyMigration = {
        ...snapshotMigrationResponse,
        status_description: 'Ready to copy data',
      }
      const {dataApi, herokuApi} = mockMigrationState(initialMigration)
      dataApi
        .get(migrationPath)
        .reply(200, preparingMigration)
        .get(migrationPath)
        .reply(200, readyMigration)
      const waitForWatchInputStub = sinon.stub(DataPgMigrate.prototype as unknown as {waitForWatchInput: () => Promise<string>}, 'waitForWatchInput').resolves('timeout')
      const setRawModeSpy = sinon.spy(process.stdin as NodeJS.ReadStream, 'setRawMode')
      sinon.define(process.stdin, 'isTTY', true)
      sinon.define(process.stdout, 'isTTY', true)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: initialMigration.id})
      promptStub.onSecondCall().resolves({action: '__watch'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(waitForWatchInputStub.callCount).to.equal(2)
      expect(setRawModeSpy.firstCall.calledWith(true)).to.equal(true)
      expect(setRawModeSpy.lastCall.calledWith(false)).to.equal(true)
      expect(stdout).to.contain('Watching status every 5 seconds. Press any key to stop.')
      expect(stdout).to.match(/Status:\s+Provisioning migration infrastructure/)
      expect(promptStub.thirdCall.args[0].choices.map((choice: {name?: string}) => choice.name).filter(Boolean)).to.deep.equal([
        'Start data copy',
        'Cancel migration',
        'Watch status',
        'Refresh status',
        'Back to migrations',
        'Exit',
      ])
    })

    it('continues through finalization and exits on a terminal status', async function () {
      const migratingMigration = {
        ...snapshotMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.MIGRATING,
        status_description: 'Copying data',
      }
      const promotingMigration = {
        ...migratingMigration,
        status: MigrationStatus.PROMOTING,
        status_description: 'Finalizing migration',
      }
      const completedMigration = {
        ...promotingMigration,
        completed: true,
        status: MigrationStatus.COMPLETED,
        status_description: 'Data migration complete; ready to verify destination',
        successful: true,
      }
      const {dataApi, herokuApi} = mockMigrationState(migratingMigration)
      dataApi
        .get(migrationPath)
        .reply(200, promotingMigration)
        .get(migrationPath)
        .reply(200, completedMigration)
      const waitForWatchInputStub = sinon.stub(DataPgMigrate.prototype as unknown as {waitForWatchInput: () => Promise<string>}, 'waitForWatchInput').resolves('timeout')
      sinon.define(process.stdin, 'isTTY', true)
      sinon.define(process.stdout, 'isTTY', true)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migratingMigration.id})
      promptStub.onSecondCall().resolves({action: '__watch'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(waitForWatchInputStub.callCount).to.equal(2)
      expect(stdout).to.match(/Status:\s+Finalizing migration/)
      expect(promptStub.thirdCall.args[0].choices.map((choice: {name?: string}) => choice.name).filter(Boolean)).to.deep.equal([
        'Refresh status',
        'Back to migrations',
        'Exit',
      ])
    })

    it('continues through cancellation cleanup and exits when cancellation completes', async function () {
      const cancellingMigration = {
        ...snapshotMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.CANCELLING,
        status_description: 'Restoring source database access',
      }
      const cancelledMigration = {
        ...cancellingMigration,
        status: MigrationStatus.CANCELLED,
        status_description: 'Migration cancelled',
      }
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      dataApi
        .get(migrationPath)
        .reply(200, cancellingMigration)
        .get(migrationPath)
        .reply(200, cancelledMigration)
      const waitForWatchInputStub = sinon.stub(DataPgMigrate.prototype as unknown as {waitForWatchInput: () => Promise<string>}, 'waitForWatchInput').resolves('timeout')
      sinon.define(process.stdin, 'isTTY', true)
      sinon.define(process.stdout, 'isTTY', true)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: snapshotMigrationResponse.id})
      promptStub.onSecondCall().resolves({action: '__watch'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(waitForWatchInputStub.callCount).to.equal(2)
      expect(stdout).to.match(/Status:\s+Restoring source database access/)
      expect(promptStub.thirdCall.args[0].choices.map((choice: {name?: string}) => choice.name).filter(Boolean)).to.deep.equal([
        'Refresh status',
        'Back to migrations',
        'Exit',
      ])
    })

    it('retries temporary 503 responses while watching', async function () {
      const initialMigration = {
        ...snapshotMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.MIGRATING,
        status_description: 'Copying data',
      }
      const updatedMigration = {
        ...initialMigration,
        completed: true,
        status: MigrationStatus.COMPLETED,
        status_description: 'Data migration complete; ready to verify destination',
        successful: true,
      }
      const {dataApi, herokuApi} = mockMigrationState(initialMigration)
      dataApi
        .get(migrationPath)
        .twice()
        .reply(503, {id: 'service_unavailable', message: 'Service unavailable'})
        .get(migrationPath)
        .reply(200, updatedMigration)
      const waitForWatchInputStub = sinon.stub(DataPgMigrate.prototype as unknown as {waitForWatchInput: () => Promise<string>}, 'waitForWatchInput').resolves('timeout')
      sinon.define(process.stdin, 'isTTY', true)
      sinon.define(process.stdout, 'isTTY', true)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: initialMigration.id})
      promptStub.onSecondCall().resolves({action: '__watch'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      const {error, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error).to.equal(undefined)
      expect(waitForWatchInputStub.callCount).to.equal(3)
      expect(stdout).to.match(/Status:\s+Copying data/)
    })

    it('fails after repeated 503 responses while watching', async function () {
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      dataApi
        .get(migrationPath)
        .times(13)
        .reply(503, {id: 'service_unavailable', message: 'Service unavailable'})
      const waitForWatchInputStub = sinon.stub(DataPgMigrate.prototype as unknown as {waitForWatchInput: () => Promise<string>}, 'waitForWatchInput').resolves('timeout')
      const setRawModeSpy = sinon.spy(process.stdin as NodeJS.ReadStream, 'setRawMode')
      sinon.define(process.stdin, 'isTTY', true)
      sinon.define(process.stdout, 'isTTY', true)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: snapshotMigrationResponse.id})
      promptStub.onSecondCall().resolves({action: '__watch'})

      const {error} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error?.message).to.contain('Service unavailable')
      expect(waitForWatchInputStub.callCount).to.equal(13)
      expect(setRawModeSpy.lastCall.calledWith(false)).to.equal(true)
    })

    it('stops watching on a keypress without polling and restores terminal input', async function () {
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      const waitForWatchInputStub = sinon.stub(DataPgMigrate.prototype as unknown as {waitForWatchInput: () => Promise<string>}, 'waitForWatchInput').resolves('keypress')
      const setRawModeSpy = sinon.spy(process.stdin as NodeJS.ReadStream, 'setRawMode')
      sinon.define(process.stdin, 'isTTY', true)
      sinon.define(process.stdout, 'isTTY', true)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: snapshotMigrationResponse.id})
      promptStub.onSecondCall().resolves({action: '__watch'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(waitForWatchInputStub.calledOnce).to.equal(true)
      expect(setRawModeSpy.firstCall.calledWith(true)).to.equal(true)
      expect(setRawModeSpy.lastCall.calledWith(false)).to.equal(true)
      expect(stdout).to.contain('Watching status every 5 seconds. Press any key to stop.')
    })

    it('treats Ctrl+C as an interrupt and restores terminal input', async function () {
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      sinon.stub(DataPgMigrate.prototype as unknown as {waitForWatchInput: () => Promise<string>}, 'waitForWatchInput').resolves('interrupt')
      const setRawModeSpy = sinon.spy(process.stdin as NodeJS.ReadStream, 'setRawMode')
      sinon.define(process.stdin, 'isTTY', true)
      sinon.define(process.stdout, 'isTTY', true)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: snapshotMigrationResponse.id})
      promptStub.onSecondCall().resolves({action: '__watch'})

      const {error} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error?.message).to.equal('SIGINT')
      expect(setRawModeSpy.firstCall.calledWith(true)).to.equal(true)
      expect(setRawModeSpy.lastCall.calledWith(false)).to.equal(true)
    })

    it('uses status description and then status', async function () {
      const statusDescriptionMigration = {
        ...existentMigrationResponse,
        status_description: 'Detailed status',
      }
      const statusMigration = {...statusDescriptionMigration, status_description: null}
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .times(2)
        .reply(200, [targetAdvancedDbAttachment, standardDbAttachment])
      const dataApi = nock('https://api.data.heroku.com')
        .get(migrationPath)
        .reply(200, statusDescriptionMigration)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(2)
        .reply(200, targetAdvancedDbInfo)
        .get(migrationPath)
        .reply(200, statusMigration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: statusDescriptionMigration.id})
      promptStub.onSecondCall().resolves({action: '__refresh'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Status:\s+Detailed status/)
      expect(stdout).to.match(/Status:\s+Preparing/)
    })

    it('uses status descriptions for terminal migrations', async function () {
      const migration = {
        ...existentMigrationResponse,
        status: MigrationStatus.FAILED,
        status_description: 'Migration failed',
      }
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Status:\s+Migration failed/)
      expect(ansis.strip(promptStub.firstCall.args[0].choices[0].name)).to.contain('| Migration failed')
    })

    it('shows source status beside the source database', async function () {
      const migration = {...existentMigrationResponse, source_status: MigrationSourceStatus.DISABLED}
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(ansis.strip(stdout)).to.match(/Source:\s+⛁ postgresql-cubic-12345 \(disabled\)/)
    })

    it('does not show raw error details', async function () {
      const migration = {
        ...existentMigrationResponse,
        last_error_message: 'Internal migration error details',
        tables_errored: 3,
      }
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Tables errored:\s+3/)
      expect(stdout).not.to.contain('Error:')
      expect(stdout).not.to.contain('Internal migration error details')
    })

    it('shows the failure summary in the status without raw failure details', async function () {
      const migration = {
        ...existentMigrationResponse,
        failure_reason: {
          category: 'target-load-failed',
          details: {message_tail: 'Internal DMS error details'},
          summary: 'DMS target load failed',
        },
        status: MigrationStatus.FAILED,
        status_description: 'Migration failed',
      }
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Status:\s+Migration failed \(DMS target load failed\)/)
      expect(stdout).not.to.contain('Failure reason:')
      expect(stdout).not.to.contain('target-load-failed')
      expect(stdout).not.to.contain('Internal DMS error details')
    })

    it('shows the compact pre-assessment summary', async function () {
      const migration = {
        ...existentMigrationResponse,
        preassessment: {failure_count: 3, status: 'completed' as const, warning_count: 2},
      }
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Pre-assessment:\s+Found 3 blocking issues and 2 warnings/)
      const detailLines = ansis.strip(stdout).split('\n').filter(line => /^(Source|Destination|Method|Status|Pre-assessment):/.test(line))
      expect(detailLines.every(line => line === line.trimEnd())).to.equal(true)
    })

    it('shows a successful pre-assessment with warnings', async function () {
      const migration = {
        ...existentMigrationResponse,
        preassessment: {failure_count: 0, status: 'completed' as const, warning_count: 1},
      }
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.match(/Pre-assessment:\s+Passed with 1 warning/)
    })

    it('does not show backend stop reasons', async function () {
      const migration = {...existentMigrationResponse, stop_reason: 'Stop Reason RECOVERABLE_ERROR'}
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: migration.id})
      promptStub.onSecondCall().resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).not.to.contain('Stop reason:')
      expect(stdout).not.to.contain('Stop Reason RECOVERABLE_ERROR')
    })

    it('omits canceled migrations from the main list', async function () {
      const migration = {
        ...snapshotMigrationResponse,
        can_cancel: false,
        can_start: false,
        status: MigrationStatus.CANCELLED,
        status_description: 'Migration cancelled',
      }
      const {dataApi, herokuApi} = mockMigrationState(migration)
      promptStub.resetBehavior()
      promptStub.resolves({action: '__exit'})

      const {stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stdout).to.contain('You haven\'t configured any migrations for ⬢ myapp yet.')
      const {choices} = promptStub.firstCall.args[0]
      expect(choices.some((choice: {value: string}) => choice.value === migration.id)).to.equal(false)
      expect(choices.map((choice: {name?: string}) => ansis.strip(choice.name ?? '')).filter(Boolean)).to.deep.equal([
        'Configure a new migration',
        'Refresh',
        'Exit',
      ])
    })

    it('supports Back to migrations and Exit from details', async function () {
      const {dataApi, herokuApi} = mockMigrationState(existentMigrationResponse, 2)
      promptStub.resetBehavior()
      promptStub.onCall(0).resolves({action: existentMigrationResponse.id})
      promptStub.onCall(1).resolves({action: '__back'})
      promptStub.onCall(2).resolves({action: existentMigrationResponse.id})
      promptStub.onCall(3).resolves({action: '__exit'})

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(promptStub.callCount).to.equal(4)
    })

    it('returns to the main list when a refreshed migration no longer exists', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .times(3)
        .reply(200, [targetAdvancedDbAttachment, standardDbAttachment])
      const dataApi = nock('https://api.data.heroku.com')
        .get(migrationPath)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .times(3)
        .reply(200, targetAdvancedDbInfo)
        .get(migrationPath)
        .twice()
        .reply(404, {id: 'not_found', message: 'Add-on not found'})
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: existentMigrationResponse.id})
      promptStub.onSecondCall().resolves({action: '__refresh'})
      promptStub.onThirdCall().resolves({action: '__exit'})

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(promptStub.thirdCall.args[0].message).to.equal('Select a migration or action:')
    })

    it('stops the mutation spinner when the run request fails', async function () {
      const {dataApi, herokuApi} = mockMigrationState(snapshotMigrationResponse)
      dataApi.post(`${migrationPath}/run`).reply(500, {id: 'server_error', message: 'Migration failed to start'})
      promptStub.resetBehavior()
      promptStub.onFirstCall().resolves({action: snapshotMigrationResponse.id})
      promptStub.onSecondCall().resolves({action: '__start_migration'})
      promptStub.onThirdCall().resolves({action: '__confirm'})

      const {error, stderr} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(error?.message).to.contain('Migration failed to start')
      expect(stderr).to.equal('Starting data copy from ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... failed\n')
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
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
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
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('creates a new migration configuration when confirmed', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Migration details: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      // Verify the confirmation message is shown
      expect(stdout).to.contain('By continuing, we prepare the necessary steps for the migration.')
      expect(stdout).to.contain('Preparing the migration deletes all the data on the destination database ⛁ postgresql-obscured-12345.')
      expect(stderr).to.equal('Configuring migration... done\n')
      expect(stdout).to.contain('=== Migration details')
      expect(stdout).to.match(/Source:\s+⛁ postgresql-convex-12345/)
      expect(stdout).to.match(/Destination:\s+⛁ postgresql-obscured-12345/)
    })

    it('shows the expected list of source databases', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
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
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Main menu: > Exit
      ]

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp', '--method=snapshot'])

      const targetDatabaseList = stdout.match(/(?<=Select the destination database: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(stderr).to.equal('Configuring migration... done\n')
      // Entry for the target database that is already a migration destination should be disabled
      expect(targetDatabaseList).to.contain(`⛁ ${targetAdvancedDbAttachment.addon.name} as ADVANCED_DB (already a destination database for an active migration)`)
      // Entry for the non-target Advanced database should be enabled
      expect(targetDatabaseList).to.contain(`⛁ ${nonTargetAdvancedDbAttachment.addon.name} as OTHER_ADVANCED_DB`)
      expect(targetDatabaseList).not.to.contain(`⛁ ${nonTargetAdvancedDbAttachment.addon.name} as OTHER_ADVANCED_DB (already a destination database for an active migration)`)
      // Entry for the unavailable database should be disabled
      expect(targetDatabaseList).to.contain(`⛁ ${unavailableAdvancedDbAttachment.addon.name} as UNAVAILABLE_DB (database isn't available)`)
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
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\u001B[A\n', // Confirm migration configuration: > Go back
        '\u001B[A\n', // Select target database: > Go back
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\u001B[A\n', // Main menu: > Exit
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
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
          targetAdvancedDbAttachment,
        ])
        .get('/apps/myapp/addon-attachments')
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
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
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
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Create database
        '\n', // Confirm migration configuration: > Confirm
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
          from: premiumDbAttachment.addon.id,
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
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...createdMigrationResponse,
          source_id: privateDbAttachment.addon.id,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Private database
        '\n', // Select target database: > Create database
        '\n', // Confirm migration configuration: > Confirm
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
          from: privateDbAttachment.addon.id,
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
        .reply(200, existentMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...createdMigrationResponse,
          source_id: shieldDbAttachment.addon.id,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Configure a database migration
        '\n', // Select source database: > Shield database
        '\n', // Select target database: > Create database
        '\n', // Confirm migration configuration: > Confirm
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
          from: shieldDbAttachment.addon.id,
          'high-availability': true,
          level: '4G-Performance',
        },
      })
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
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',  // Select configure migration
        '\n',  // Select source database
        '\n',  // Select target database
        '\n',  // Select snapshot method (first option, default)
        '\n',  // Confirm migration
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
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',          // Select configure migration
        '\n',          // Select source database
        '\n',          // Select target database
        '\u001B[B\n',  // Select streaming option from method selection
        '\n',          // Confirm migration
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

      const {stderr, stdout} = await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
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
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',          // Select configure migration
        '\n',          // Select source database
        '\n',          // Select target database
        '\u001B[B\n',  // Select streaming method (first selection)
        '\u001B[A\n',  // Confirm migration configuration: > Go back
        '\n',          // Select snapshot method (second selection, default)
        '\n',          // Confirm migration
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
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',  // Select configure migration
        '\n',  // Select source database
        '\n',  // Select target database
        '\n',  // Confirm migration (no method selection prompt)
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
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, nonTargetAdvancedDbInfo)

      mockedStdinInput = [
        '\n',  // Select configure migration
        '\n',  // Select source database
        '\n',  // Select target database
        '\n',  // Confirm migration (no method selection prompt)
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
})
