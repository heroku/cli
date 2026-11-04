import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import ansis from 'ansis'
import {expect} from 'chai'
import inquirer from 'inquirer'
import mockStdin from 'mock-stdin'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgUpdate from '../../../../../src/commands/data/pg/update.js'
import PoolConfig from '../../../../../src/lib/data/pool-config.js'
import {clearLevelsAndPricingCache} from '../../../../../src/lib/data/utils.js'
import {
  addon,
  advancedAddonAttachment,
  createPoolResponse,
  levelsResponse,
  nonAdvancedAddon,
  nonAdvancedAddonAttachment,
  nonPostgresAddonAttachment,
  pgInfo,
  pricingResponse,
} from '../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc
const {prompt} = inquirer

// The rendered pool menu right-pads each choice, so every line carries a
// trailing space. Strip per-line trailing whitespace from the captured output
// before matching so the multi-line heredoc expectations stay free of
// invisible trailing spaces.
const stripTrailing = (output: string): string =>
  ansis.strip(output).split('\n').map(line => line.replace(/[ \t]+$/, '')).join('\n')

// Keystroke that selects a list prompt's last option ("Exit" / "Go back").
// inquirer's list prompt re-indexes only the enabled, non-separator choices
// starting at 0, and arrow keys wrap around that list, so a single Up press
// from the initial cursor lands on the last choice. A bare Enter selects the
// first option; under SDK stubs that resolve indefinitely, re-entering the menu
// on empty stdin would hang, so every menu-exit keystroke uses an Up press.
const EXIT = '\u001B[A\n'

// The command fetches pool info and performs pool mutations through the SDK's
// data service (data.postgres.info, data.postgresPool.{create,delete,update}).
// Tests stub these directly; the Platform calls (addon-attachment listing,
// addon resolution) and the levels/pricing lookup still go through nock because
// they run on this.heroku / this.dataApi, not the SDK.
interface FakeData {
  postgres: {
    info: SinonStub
  }
  postgresPool: {
    create: SinonStub
    delete: SinonStub
    update: SinonStub
  }
}

describe('data:pg:update', function () {
  let stdin: mockStdin.MockSTDIN
  let mockedStdinInput: string[] = []
  let fakeData: FakeData
  let poolConfigLevelStepStub: SinonStub
  let poolConfigInstanceCountStepStub: SinonStub
  let poolConfigFollowerInteractiveConfigStub: SinonStub

  beforeEach(function () {
    // Create stubs for PoolConfig methods
    stdin = mockStdin.stdin()
    poolConfigLevelStepStub = stub(PoolConfig.prototype, 'levelStep')
    poolConfigInstanceCountStepStub = stub(PoolConfig.prototype, 'instanceCountStep')
    poolConfigFollowerInteractiveConfigStub = stub(PoolConfig.prototype, 'followerInteractiveConfig')
    fakeData = {
      postgres: {
        info: stub().resolves(structuredClone(pgInfo)),
      },
      postgresPool: {
        create: stub().resolves(structuredClone(createPoolResponse)),
        delete: stub().resolves(),
        update: stub().resolves(),
      },
    }
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)
    stub(DataPgUpdate.prototype, 'prompt').callsFake(async (...args: Parameters<typeof prompt>) => {
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
    restore()
    stdin.restore()
    nock.cleanAll()
  })

  describe('interactive database selection (no DATABASE argument)', function () {
    it('allows the user to select a database from a list of Advanced-tier databases only', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          advancedAddonAttachment,
          nonAdvancedAddonAttachment,
          nonPostgresAddonAttachment,
        ])

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = [EXIT]

      const {stdout} = await runCommand(DataPgUpdate, ['--app=myapp'])

      herokuApi.done()
      expect(stdout).to.contain('advanced-horizontal-01234 (DATABASE)')
      expect(stdout).not.to.contain('standard-database (STANDARD_DATABASE)')
      expect(stdout).not.to.contain('redis-database (REDIS)')
    })

    it('errors out when no Advanced-tier databases are found', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .get('/apps/myapp/addon-attachments')
        .reply(200, [
          nonAdvancedAddonAttachment,
          nonPostgresAddonAttachment,
        ])

      const {error} = await runCommand(DataPgUpdate, ['--app=myapp'])
      const err = error as Error
      herokuApi.done()
      expect(err.message).to.equal('No Heroku Postgres Advanced-tier databases found on the app.')
    })
  })

  describe('non-interactive database selection (DATABASE argument provided)', function () {
    it('shows the pool list selection prompt', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info.resolves(structuredClone(pgInfo))

      // Simulate the user selecting the 'Exit' option by pressing the up arrow and then Enter
      mockedStdinInput = [EXIT]

      const {stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgres.info.calledWith(addon.id)).to.be.true
      expect(stdout).to.contain('Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each')
      expect(stdout).to.contain('Follower analytics: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each')
      expect(stdout).to.contain('Add a follower pool')
      expect(stdout).to.contain('Exit')
    })

    it('errors out when the database isn\'t an Advanced-tier one', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [nonAdvancedAddon])

      const {error} = await runCommand(DataPgUpdate, ['STANDARD_DATABASE', '--app=myapp'])
      const err = error as Error
      herokuApi.done()
      expect(ansis.strip(err.message)).to.equal(heredoc`
          You can only use this command on Advanced-tier databases.
          Use heroku addons:upgrade standard-database -a myapp instead.`)
    })
  })

  describe('leader pool actions', function () {
    it('allows the user to change the leader pool level', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info
        .onFirstCall().resolves(structuredClone(pgInfo))
        .onSecondCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            {
              ...pgInfo.pools[0],
              expected_level: '8G-Performance',
              status: 'modifying',
            },
            pgInfo.pools[1],
          ],
        }))

      // Simulate the user selections
      mockedStdinInput = [
        '\n', // Pool selection prompt: selects 'Leader' pool
        '\n', // Pool action prompt: selects 'Change pool level'
        // 8G-Performance level selected and applied, returns to the action prompt
        '\u001B[A\n', // Pool action prompt: selects 'Go back'
        '\u001B[A\n', // Pool selection prompt: selects 'Exit'
      ]

      // Simulate the user selecting the 8G-Performance level on the level selection prompt
      poolConfigLevelStepStub.resolves(levelsResponse.items[1].name)

      const {stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgresPool.update.calledOnceWith(
        addon.id,
        pgInfo.pools[0].id,
        {level: levelsResponse.items[1].name},
      )).to.be.true
      expect(ansis.strip(stdout)).to.contain('Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each')
      expect(ansis.strip(stdout)).to.contain('Success: Level changed from 4G-Performance to 8G-Performance for leader pool.')
      expect(ansis.strip(stdout)).to.contain('Leader: 8G-Performance 4 vCPU 8 GB MEM 2 instances starting at ~$0.278/hour ($200/month) each')
    })

    it('allows the user to remove the high availability (HA) standby instance from the leader pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info
        .onFirstCall().resolves(structuredClone(pgInfo))
        .onSecondCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            {
              ...pgInfo.pools[0],
              expected_count: 1,
              status: 'modifying',
            },
            pgInfo.pools[1],
          ],
        }))

      // Simulate the user selections
      mockedStdinInput = [
        '\n', // Pool selection prompt: selects 'Leader' pool
        '\u001B[B\n', // Pool action prompt: selects 'Remove high availability'
        // HA removed, returns to the action prompt
        '\u001B[A\n', // Pool action prompt: selects 'Go back'
        '\u001B[A\n', // Pool selection prompt: selects 'Exit'
      ]

      const {stderr, stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgresPool.update.calledOnceWith(
        addon.id,
        pgInfo.pools[0].id,
        {count: 1},
      )).to.be.true
      expect(ansis.strip(stdout)).to.contain('Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each')
      expect(ansis.strip(stderr)).to.contain('Removing the high availability (HA) standby instance from advanced-horizontal-01234... done')
      expect(ansis.strip(stdout)).to.contain('Leader: 4G-Performance 2 vCPU 4 GB MEM 1 instance starting at ~$0.083/hour ($60/month)')
    })

    it('allows the user to add a high availability (HA) standby instance to the leader pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info
        .onFirstCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            {
              ...pgInfo.pools[0],
              compute_instances: [
                pgInfo.pools[0].compute_instances[0],
              ],
              expected_count: 1,
            },
            pgInfo.pools[1],
          ],
        }))
        .onSecondCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            {
              ...pgInfo.pools[0],
              expected_count: 2,
              status: 'modifying',
            },
            pgInfo.pools[1],
          ],
        }))

      // Simulate the user selections
      mockedStdinInput = [
        '\n', // Pool selection prompt: selects 'Leader' pool
        '\u001B[B\n', // Pool action prompt: selects 'Add high availability'
        // HA added, returns to the action prompt
        '\u001B[A\n', // Pool action prompt: selects 'Go back'
        '\u001B[A\n', // Pool selection prompt: selects 'Exit'
      ]

      const {stderr, stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgresPool.update.calledOnceWith(
        addon.id,
        pgInfo.pools[0].id,
        {count: 2},
      )).to.be.true
      expect(ansis.strip(stdout)).to.contain('Leader: 4G-Performance 2 vCPU 4 GB MEM 1 instance starting at ~$0.083/hour ($60/month)')
      expect(ansis.strip(stderr)).to.contain('Adding a high availability (HA) standby instance for advanced-horizontal-01234... done')
      expect(ansis.strip(stdout)).to.contain('Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each')
    })
  })

  describe('follower pool actions', function () {
    it('allows the user to change the follower pool level', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info
        .onFirstCall().resolves(structuredClone(pgInfo))
        .onSecondCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            pgInfo.pools[0],
            {
              ...pgInfo.pools[1],
              expected_level: '8G-Performance',
              status: 'modifying',
            },
          ],
        }))

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Pool selection prompt: selects 'Follower analytics' pool
        '\n', // Pool action prompt: selects 'Change pool level'
        // 8G-Performance level selected and applied, returns to the action prompt
        '\u001B[A\n', // Pool action prompt: selects 'Go back'
        '\u001B[A\n', // Pool selection prompt: selects 'Exit'
      ]

      // Simulate the user selecting the 8G-Performance level on the level selection prompt
      poolConfigLevelStepStub.resolves(levelsResponse.items[1].name)

      const {stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgresPool.update.calledOnceWith(
        addon.id,
        pgInfo.pools[1].id,
        {level: levelsResponse.items[1].name},
      )).to.be.true
      expect(ansis.strip(stdout)).to.contain('Follower analytics: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each')
      expect(ansis.strip(stdout)).to.contain('Success: Level changed from 4G-Performance to 8G-Performance for follower pool analytics.')
      expect(ansis.strip(stdout)).to.contain('Follower analytics: 8G-Performance 4 vCPU 8 GB MEM 2 instances starting at ~$0.278/hour ($200/month) each')
    })

    it('allows the user to update the number of instances in the follower pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info
        .onFirstCall().resolves(structuredClone(pgInfo))
        .onSecondCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            pgInfo.pools[0],
            {
              ...pgInfo.pools[1],
              expected_count: 1,
              status: 'modifying',
            },
          ],
        }))

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Pool selection prompt: selects 'Follower analytics' pool
        '\u001B[B\n', // Pool action prompt: selects 'Update number of instances'
        // 1 instance selected and applied, returns to the action prompt
        '\u001B[A\n', // Pool action prompt: selects 'Go back'
        '\u001B[A\n', // Pool selection prompt: selects 'Exit'
      ]

      // Simulate the user selecting the 1 instance on the instance count selection prompt
      poolConfigInstanceCountStepStub.resolves('1')

      const {stderr, stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgresPool.update.calledOnceWith(
        addon.id,
        pgInfo.pools[1].id,
        {count: 1},
      )).to.be.true
      expect(ansis.strip(stdout)).to.contain('Follower analytics: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each')
      expect(ansis.strip(stderr)).to.contain('Updating follower pool instances count... done')
      expect(ansis.strip(stdout)).to.contain('Follower analytics: 4G-Performance 2 vCPU 4 GB MEM 1 instance starting at ~$0.083/hour ($60/month)')
    })

    it('allows the user to destroy the follower pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info
        .onFirstCall().resolves(structuredClone(pgInfo))
        .onSecondCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            pgInfo.pools[0],
          ],
        }))

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\n', // Pool selection prompt: selects 'Follower analytics' pool
        '\u001B[B\u001B[B\n', // Pool action prompt: selects 'Destroy pool'
        // Pool destroyed, returns to the pool selection prompt
        '\u001B[A\n', // Pool selection prompt: selects 'Exit'
      ]

      // Simulate the user selecting the 1 instance on the instance count selection prompt
      poolConfigInstanceCountStepStub.resolves('1')

      // Simulate the user confirming the pool destruction
      stub(DataPgUpdate.prototype, 'confirmCommand').resolves()

      const {stderr, stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgresPool.delete.calledOnceWith(addon.id, pgInfo.pools[1].id)).to.be.true
      expect(stripTrailing(stdout)).to.contain(heredoc`
        Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
          Follower analytics: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
      `)
      expect(ansis.strip(stderr)).to.contain('Destroying follower pool analytics on ⛁ advanced-horizontal-01234... done')
      expect(stripTrailing(stdout)).to.contain(heredoc`
        Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
          ──────────────
      `)
    })
  })

  describe('adding another follower pool', function () {
    it('allows the user to configure a new follower pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/actions/addons/resolve')
        .reply(200, [addon])

      const dataApi = nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      fakeData.postgres.info
        .onFirstCall().resolves(structuredClone(pgInfo))
        .onSecondCall().resolves(structuredClone({
          ...pgInfo,
          pools: [
            ...pgInfo.pools,
            createPoolResponse,
          ],
        }))
      fakeData.postgresPool.create.resolves(structuredClone(createPoolResponse))

      // Simulate the user selections
      mockedStdinInput = [
        '\u001B[B\u001B[B\n', // Pool selection prompt: selects 'Add a follower pool'
        // A new follower pool is configured, returns to the pool selection prompt
        '\u001B[A\n', // Pool selection prompt: selects 'Exit'
      ]

      // Simulate the user configuring a 4G-Performance 'readers' follower pool with 2 instances
      poolConfigFollowerInteractiveConfigStub.resolves({
        count: 2,
        level: levelsResponse.items[0].name,
        name: 'readers',
      })

      const {stderr, stdout} = await runCommand(DataPgUpdate, ['DATABASE', '--app=myapp'])

      herokuApi.done()
      dataApi.done()
      expect(fakeData.postgresPool.create.calledOnceWith(addon.id, {
        count: 2,
        level: levelsResponse.items[0].name,
        name: 'readers',
      })).to.be.true
      expect(stripTrailing(stdout)).to.contain(heredoc`
        Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
          Follower analytics: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
          ──────────────
      `)
      expect(ansis.strip(stderr)).to.contain('Configuring follower pool... done')
      expect(stripTrailing(stdout)).to.contain(heredoc`
        Leader: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
          Follower analytics: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
          Follower readers: 4G-Performance 2 vCPU 4 GB MEM 2 instances starting at ~$0.083/hour ($60/month) each
          ──────────────
      `)
    })
  })
})
