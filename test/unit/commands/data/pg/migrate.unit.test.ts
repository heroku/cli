/* eslint-disable import/no-named-as-default-member */
// import * as Heroku from '@heroku-cli/schema'
import {hux} from '@heroku/heroku-cli-util'
import {expect} from 'chai'
import inquirer from 'inquirer'
import mockStdin from 'mock-stdin'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import DataPgMigrate from '../../../../../src/commands/data/pg/migrate.js'
// import PoolConfig from '../../../../../src/lib/data/poolConfig.js'
import {DatabaseStatus, MigrationStatus} from '../../../../../src/lib/data/types.js'
import {clearLevelsAndPricingCache} from '../../../../../src/lib/data/utils.js'
import {
  createdMigrationResponse,
  essentialDbAttachment,
  existentMigrationResponse,
  foreignAdvancedDbAttachment,
  foreignStandardDbAttachment,
  // levelsResponse,
  nonPostgresAddonAttachment,
  nonTargetAdvancedDbAttachment,
  nonTargetAdvancedDbInfo,
  premiumDbAttachment,
  // pricingResponse,
  // privateDbAttachment,
  // shieldDbAttachment,
  standardDbAttachment,
  targetAdvancedDbAttachment,
  targetAdvancedDbInfo,
  unavailableAdvancedDbAttachment,
  unavailableAdvancedDbInfo,
} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'

const {prompt} = inquirer

describe('data:pg:migrate', function () {
  // let createAddonStub: sinon.SinonStub
  let mockedStdinInput: string[] = []
  // let poolConfigLeaderInteractiveConfigStub: sinon.SinonStub
  let stdin: mockStdin.MockSTDIN

  beforeEach(function () {
    // createAddonStub = sinon.stub(DataPgMigrate.prototype, 'createAddon')
    // poolConfigLeaderInteractiveConfigStub = sinon.stub(PoolConfig.prototype, 'leaderInteractiveConfig')
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

      // Simulate the user selecting the 'Exit' option by pressing Enter
      mockedStdinInput = ['\n']

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).not.to.match(/Source Database\s+Destination Database\s+Status/)
      expect(stdout.output).to.contain('There are no migrations configured for ⬢ myapp yet.')
    })

    it('enables configuring a new migration option when there are classic databases owned by the app', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          standardDbAttachment,
        ])

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.contain('Configure a new migration')
      expect(stdout.output).not.to.contain('no classic Postgres databases pending migration on ⬢ myapp')
    })

    it('disables configuring a new migration option when there are no classic databases owned by the app', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          foreignStandardDbAttachment,
        ])

      // Simulate the user selecting the 'Exit' option by pressing Enter
      mockedStdinInput = ['\n']

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.contain('- Configure a new migration (no classic Postgres databases pending migration on ⬢ myapp)')
    })

    it('disables the start and cancel migration options', async function () {
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

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.contain('- Start a migration (no ready migrations on ⬢ myapp)')
      expect(stdout.output).to.contain('- Cancel a migration (no ready migrations on ⬢ myapp)')
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

      // Simulate the user selecting the 'Exit' option by pressing Enter
      mockedStdinInput = ['\n']

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).not.to.contain('There are no migrations configured for ⬢ myapp yet.')
      expect(stdout.output).to.match(/Source Database\s+Destination Database\s+Status/)
      expect(stdout.output).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Preparing/)
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

      // Simulate the user selecting the 'Exit' option by pressing Enter
      mockedStdinInput = ['\n']

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.contain('- Configure a new migration (no classic Postgres databases pending migration on ⬢ myapp)')
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

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.contain('Configure a new migration')
      expect(stdout.output).not.to.contain('no classic Postgres databases pending migration on ⬢ myapp')
    })

    it('disables the start and cancel migration options if there are no ready migrations', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      const dataApi = nock('https://api.data.heroku.com')
      const nonReadyStatuses = Object.values(MigrationStatus).filter(status => status !== MigrationStatus.READY)
      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter for each non-ready status
      mockedStdinInput = Array.from({length: nonReadyStatuses.length}, () => '\u001B[A\n')

      for (const status of nonReadyStatuses) {
        dataApi
          .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
          .reply(200, {
            ...existentMigrationResponse,
            status,
          })
          .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
          .reply(200, targetAdvancedDbInfo)

        await runCommand(DataPgMigrate, ['--app=myapp'])

        dataApi.done()
        expect(stderr.output).to.equal('')
        expect(stdout.output).to.match(
          new RegExp(`⛁ postgresql-cubic-12345\\s+⛁ postgresql-lively-12345\\s+${hux.toTitleCase(status.toString())}`),
        )
        expect(stdout.output).to.contain('- Start a migration (no ready migrations on ⬢ myapp)')
        expect(stdout.output).to.contain('- Cancel a migration (no ready migrations on ⬢ myapp)')
      }

      herokuApi.done()
    })

    it('enables the start and cancel migration options if there are ready migrations', async function () {
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
          status: MigrationStatus.READY,
        })
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = ['\u001B[A\n']

      await runCommand(DataPgMigrate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(stderr.output).to.equal('')
      expect(stdout.output).to.match(/⛁ postgresql-cubic-12345\s+⛁ postgresql-lively-12345\s+Ready/)
      expect(stdout.output).to.contain('Start a migration')
      expect(stdout.output).to.contain('Cancel a migration')
      expect(stdout.output).not.to.contain('no ready migrations on ⬢ myapp')
    })
  })

  describe('configure a new migration with an existing candidate target database for the migration', function () {
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
        '\n', // Main menu: > Configure a new migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        '\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      // Verify the confirmation message is shown
      expect(stdout.output).to.contain('By continuing, we prepare the necessary steps for the migration.')
      expect(stderr.output).to.equal('Configuring migration... done\n')
      // Verify the new migration is shown on the configured migrations table
      expect(stdout.output).to.match(/⛁ postgresql-convex-12345\s+⛁ postgresql-obscured-12345\s+Preparing/)
    })

    it('shows the expected list of source databases', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\n', // Main menu: > Configure a new migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        '\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      const sourceDatabaseList = stdout.output.match(/(?<=Select the source database: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(stderr.output).to.equal('Configuring migration... done\n')
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
        '\n', // Main menu: > Configure a new migration
        '\n', // Select source database: > Premium database
        '\n', // Select target database: > Non-target Advanced database
        '\n', // Confirm migration configuration: > Confirm
        '\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      const targetDatabaseList = stdout.output.match(/(?<=Select the destination database: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      expect(stderr.output).to.equal('Configuring migration... done\n')
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
        '\n',         // Main menu: > Configure a new migration
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\u001B[A\n', // Confirm migration configuration: > Go back
        '\u001B[A\n', // Select target database: > Go back
        '\n',         // Select source database: > Premium database
        '\n',         // Select target database: > Non-target Advanced database
        '\n',         // Confirm migration configuration: > Confirm
        '\n',         // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stderr.output).to.equal('Configuring migration... done\n')
      expect(stdout.output.match(/Select the source database: \(Use arrow keys\)/g)?.length).to.equal(2)
      expect(stdout.output.match(/Select the destination database: \(Use arrow keys\)/g)?.length).to.equal(3)
      expect(stdout.output.match(/Confirm migration configuration: \(Use arrow keys\)/g)?.length).to.equal(2)
    })
  })

  // We're disabling the option to create a new Advanced database while configuring a migration until the backend is updated
  // to support it.
  //
  // describe('configure a new migration with a new target database created for the migration', function () {
  //   beforeEach(async function () {
  //     poolConfigLeaderInteractiveConfigStub.resolves({
  //       action: '__confirm',
  //       highAvailability: true,
  //       level: '4G-Performance',
  //     })
  //     createAddonStub.resolves(nonTargetAdvancedDbAttachment.addon as unknown as Heroku.AddOn)
  //   })

  //   afterEach(function () {
  //     nock.cleanAll()
  //   })

  //   it('creates a database without private or shield networking for a non-Private/Shield source database', async function () {
  //     const herokuApi = nock('https://api.heroku.com')
  //       .get('/apps/myapp/addon-attachments')
  //       .reply(200, [
  //         premiumDbAttachment,
  //         standardDbAttachment,
  //         targetAdvancedDbAttachment,
  //       ])
  //       .get('/apps/myapp/addon-attachments')
  //       .reply(200, [
  //         nonTargetAdvancedDbAttachment,
  //         premiumDbAttachment,
  //         standardDbAttachment,
  //         targetAdvancedDbAttachment,
  //       ])
  //     const dataApi = nock('https://api.data.heroku.com')
  //       .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, existentMigrationResponse)
  //       .get('/data/postgres/v1/levels/advanced')
  //       .reply(200, levelsResponse)
  //       .get('/data/postgres/v1/pricing')
  //       .reply(200, pricingResponse)
  //       .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
  //         source_id: premiumDbAttachment.addon.id,
  //       })
  //       .reply(200, createdMigrationResponse)
  //       .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, existentMigrationResponse)
  //       .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, createdMigrationResponse)

  //     // Simulate the user selections
  //     mockedStdinInput = [
  //       '\n', // Main menu: > Configure a new migration
  //       '\n', // Select source database: > Premium database
  //       '\n', // Select target database: > Create database
  //       '\n', // Confirm migration configuration: > Confirm
  //       '\n', // Main menu: > Exit
  //     ]

  //     await runCommand(DataPgMigrate, ['--app=myapp'])

  //     herokuApi.done()
  //     dataApi.done()
  //     expect(stderr.output).to.equal('Configuring migration... done\n')
  //     expect(stdout.output).to.contain('→ Configure Leader Pool')
  //     expect(createAddonStub.calledOnce)
  //     expect(createAddonStub.args[0][1]).to.equal(premiumDbAttachment.addon.app.name)
  //     // Verify the service plan is correct (no private or shield networking)
  //     expect(createAddonStub.args[0][2]).to.equal('heroku-postgresql:advanced')
  //     expect(createAddonStub.args[0][5]).to.deep.include({
  //       config: {
  //         'high-availability': true,
  //         level: '4G-Performance',
  //       },
  //     })
  //   })

  //   it('creates a database with private networking for a Private source database', async function () {
  //     const herokuApi = nock('https://api.heroku.com')
  //       .get('/apps/myapp/addon-attachments')
  //       .reply(200, [
  //         privateDbAttachment,
  //         standardDbAttachment,
  //         targetAdvancedDbAttachment,
  //       ])
  //       .get('/apps/myapp/addon-attachments')
  //       .reply(200, [
  //         nonTargetAdvancedDbAttachment,
  //         privateDbAttachment,
  //         standardDbAttachment,
  //         targetAdvancedDbAttachment,
  //       ])
  //     const dataApi = nock('https://api.data.heroku.com')
  //       .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, existentMigrationResponse)
  //       .get('/data/postgres/v1/levels/advanced')
  //       .reply(200, levelsResponse)
  //       .get('/data/postgres/v1/pricing')
  //       .reply(200, pricingResponse)
  //       .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
  //         source_id: privateDbAttachment.addon.id,
  //       })
  //       .reply(200, {
  //         ...createdMigrationResponse,
  //         source_id: privateDbAttachment.addon.id,
  //       })
  //       .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, existentMigrationResponse)
  //       .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, {
  //         ...createdMigrationResponse,
  //         source_id: privateDbAttachment.addon.id,
  //       })

  //     // Simulate the user selections
  //     mockedStdinInput = [
  //       '\n', // Main menu: > Configure a new migration
  //       '\n', // Select source database: > Private database
  //       '\n', // Select target database: > Create database
  //       '\n', // Confirm migration configuration: > Confirm
  //       '\n', // Main menu: > Exit
  //     ]

  //     await runCommand(DataPgMigrate, ['--app=myapp'])

  //     herokuApi.done()
  //     dataApi.done()
  //     expect(stderr.output).to.equal('Configuring migration... done\n')
  //     expect(stdout.output).to.contain('→ Configure Leader Pool')
  //     expect(createAddonStub.calledOnce)
  //     expect(createAddonStub.args[0][1]).to.equal(privateDbAttachment.addon.app.name)
  //     // Verify the service plan is correct (private networking)
  //     expect(createAddonStub.args[0][2]).to.equal('heroku-postgresql:advanced-private')
  //     expect(createAddonStub.args[0][5]).to.deep.include({
  //       config: {
  //         'high-availability': true,
  //         level: '4G-Performance',
  //       },
  //     })
  //   })

  //   it('creates a database with shield networking for a Shield source database', async function () {
  //     const herokuApi = nock('https://api.heroku.com')
  //       .get('/apps/myapp/addon-attachments')
  //       .reply(200, [
  //         shieldDbAttachment,
  //         standardDbAttachment,
  //         targetAdvancedDbAttachment,
  //       ])
  //       .get('/apps/myapp/addon-attachments')
  //       .reply(200, [
  //         nonTargetAdvancedDbAttachment,
  //         shieldDbAttachment,
  //         standardDbAttachment,
  //         targetAdvancedDbAttachment,
  //       ])
  //     const dataApi = nock('https://api.data.heroku.com')
  //       .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, existentMigrationResponse)
  //       .get('/data/postgres/v1/levels/advanced')
  //       .reply(200, levelsResponse)
  //       .get('/data/postgres/v1/pricing')
  //       .reply(200, pricingResponse)
  //       .post(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`, {
  //         source_id: shieldDbAttachment.addon.id,
  //       })
  //       .reply(200, {
  //         ...createdMigrationResponse,
  //         source_id: shieldDbAttachment.addon.id,
  //       })
  //       .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, existentMigrationResponse)
  //       .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
  //       .reply(200, {
  //         ...createdMigrationResponse,
  //         source_id: shieldDbAttachment.addon.id,
  //       })

  //     // Simulate the user selections
  //     mockedStdinInput = [
  //       '\n', // Main menu: > Configure a new migration
  //       '\n', // Select source database: > Shield database
  //       '\n', // Select target database: > Create database
  //       '\n', // Confirm migration configuration: > Confirm
  //       '\n', // Main menu: > Exit
  //     ]

  //     await runCommand(DataPgMigrate, ['--app=myapp'])

  //     herokuApi.done()
  //     dataApi.done()
  //     expect(stderr.output).to.equal('Configuring migration... done\n')
  //     expect(stdout.output).to.contain('→ Configure Leader Pool')
  //     expect(createAddonStub.calledOnce)
  //     expect(createAddonStub.args[0][1]).to.equal(shieldDbAttachment.addon.app.name)
  //     // Verify the service plan is correct (shield networking)
  //     expect(createAddonStub.args[0][2]).to.equal('heroku-postgresql:advanced-shield')
  //     expect(createAddonStub.args[0][5]).to.deep.include({
  //       config: {
  //         'high-availability': true,
  //         level: '4G-Performance',
  //       },
  //     })
  //   })
  // })

  describe('start a migration', function () {
    let herokuApi: nock.Scope
    let dataApi: nock.Scope

    beforeEach(function () {
      herokuApi = nock('https://api.heroku.com')
        .persist(true)
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...existentMigrationResponse,
          status: MigrationStatus.READY,
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, {...nonTargetAdvancedDbInfo, status: DatabaseStatus.MIGRATING})
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/run`)
        .reply(202, {})
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...existentMigrationResponse,
          status: MigrationStatus.MIGRATING,
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, {...nonTargetAdvancedDbInfo, status: DatabaseStatus.MIGRATING})
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('starts the migration', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\n',         // Main menu: > Start a migration
        '\n',         // Select migration: > Choose the first ready migration
        '\n',         // Confirm migration start: > Confirm
        '\u001B[A\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      // Verify the confirmation message is displayed
      expect(stdout.output).to.contain('Your database ⛁ postgresql-cubic-12345 will be unavailable after starting the migration until the migration is complete.')
      expect(stderr.output).to.equal('Starting migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('shows the expected list of migrations to choose from', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\n',         // Main menu: > Start a migration
        '\n',         // Select migration: > Choose the first ready migration
        '\n',         // Confirm migration start: > Confirm
        '\u001B[A\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      const migrationList = stdout.output.match(/(?<=Select the migration to start: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      // The ready migration should appear in the list
      expect(migrationList).to.contain('From ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345')
      // The non-ready migration should not appear in the list
      expect(migrationList).not.to.contain('From ⛁ postgresql-convex-12345 to ⛁ postgresql-obscured-12345')
    })

    it('allows the user to navigate back on every step', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\n',         // Main menu: > Start a migration
        '\n',         // Select migration: > Choose the first ready migration
        '\u001B[A\n', // Confirm migration start: > Go back
        '\n',         // Select migration: > Choose the first ready migration
        '\n', // Confirm migration start: > Confirm
        '\u001B[A\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stdout.output.match(/Select the migration to start: \(Use arrow keys\)/g)?.length).to.equal(2)
      expect(stdout.output.match(/Confirm to start migration: \(Use arrow keys\)/g)?.length).to.equal(2)
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
          nonTargetAdvancedDbAttachment,
          premiumDbAttachment,
          targetAdvancedDbAttachment,
          standardDbAttachment,
        ])
      dataApi = nock('https://api.data.heroku.com')
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...existentMigrationResponse,
          status: MigrationStatus.READY,
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, targetAdvancedDbInfo)
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, {...nonTargetAdvancedDbInfo, status: DatabaseStatus.MIGRATING})
        .post(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations/cancel`)
        .reply(202, {})
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, {
          ...existentMigrationResponse,
          status: MigrationStatus.CANCELLED,
        })
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/migrations`)
        .reply(200, createdMigrationResponse)
        .get(`/data/postgres/v1/${targetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, {...targetAdvancedDbInfo, status: DatabaseStatus.AVAILABLE})
        .get(`/data/postgres/v1/${nonTargetAdvancedDbAttachment.addon.id}/info`)
        .reply(200, {...nonTargetAdvancedDbInfo, status: DatabaseStatus.MIGRATING})
    })

    afterEach(function () {
      herokuApi.done()
      dataApi.done()
      nock.cleanAll()
    })

    it('cancels the migration', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Cancel a migration
        '\n',         // Select migration: > Choose the first ready migration
        '\n',         // Confirm migration cancel: > Confirm
        '\u001B[A\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      // Verify the confirmation message is displayed
      expect(stdout.output).to.contain('After cancelling, you\'ll have to create a new migration configuration')
      expect(stderr.output).to.equal('Cancelling migration of ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345... done\n')
    })

    it('shows the expected list of migrations to choose from', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Cancel a migration
        '\n',         // Select migration: > Choose the first ready migration
        '\n',         // Confirm migration cancel: > Confirm
        '\u001B[A\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      const migrationList = stdout.output.match(/(?<=Select the migration to cancel: \(Use arrow keys\)\n)(.*?)(?=Go back)/s)?.[1]
      // The ready migration should appear in the list
      expect(migrationList).to.contain('From ⛁ postgresql-cubic-12345 to ⛁ postgresql-lively-12345')
      // The non-ready migration should not appear in the list
      expect(migrationList).not.to.contain('From ⛁ postgresql-convex-12345 to ⛁ postgresql-obscured-12345')
    })

    it('allows the user to navigate back on every step', async function () {
      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Main menu: > Cancel a migration
        '\n',         // Select migration: > Choose the first ready migration
        '\u001B[A\n', // Confirm migration cancel: > Go back
        '\n',         // Select migration: > Choose the first ready migration
        '\n', // Confirm migration cancel: > Confirm
        '\u001B[A\n', // Main menu: > Exit
      ]

      await runCommand(DataPgMigrate, ['--app=myapp'])

      expect(stdout.output.match(/Select the migration to cancel: \(Use arrow keys\)/g)?.length).to.equal(2)
      expect(stdout.output.match(/Confirm to cancel migration: \(Use arrow keys\)/g)?.length).to.equal(2)
    })
  })
})
