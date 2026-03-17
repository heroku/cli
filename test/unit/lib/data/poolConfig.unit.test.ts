import {expect} from 'chai'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'

import PoolConfig from '../../../../src/lib/data/poolConfig.js'
import {ExtendedPostgresLevelInfo} from '../../../../src/lib/data/types.js'
import {
  levelsResponse,
  pricingResponse,
} from '../../../fixtures/data/pg/fixtures.js'

describe('PoolConfig', function () {
  let promptStub: sinon.SinonStub
  let extendedLevelsInfo: ExtendedPostgresLevelInfo[]

  beforeEach(function () {
    extendedLevelsInfo = levelsResponse.items.map(item => ({
      connection_limit: item.connection_limit,
      memory_in_gb: item.memory_in_gb,
      name: item.name,
      pricing: Object.entries(pricingResponse.advanced).find(
        ([, value]) => value.product_description === item.name,
      )?.[1],
      vcpu: item.vcpu,
    }))
    promptStub = sinon.stub(PoolConfig.prototype, 'prompt')
  })

  afterEach(function () {
    sinon.restore()
  })

  describe('followerInteractiveConfig', function () {
    it('allows the user to configure a follower pool', async function () {
      promptStub
        .onCall(0).resolves({level: levelsResponse.items[0].name}) // Follower level selection
        .onCall(1).resolves({action: '1'}) // Follower count selection (select 1 instance)
        .onCall(2).resolves({action: '__yes'}) // Name the follower pool? (yes)
        .onCall(3).resolves({name: 'readonly'}) // Name the follower pool
        .onCall(4).resolves({action: '__confirm'}) // Confirmation

      const poolConfig = new PoolConfig(extendedLevelsInfo, 1)
      stdout.start()
      stderr.start()
      const {count, level, name} = await poolConfig.followerInteractiveConfig()
      stderr.stop()
      stdout.stop()
      expect(level).to.equal(levelsResponse.items[0].name)
      expect(count).to.equal(1)
      expect(name).to.equal('readonly')
      expect(stderr.output).to.contain('A cluster can have up to 13 follower instances.')
      expect(stderr.output).to.contain('Configure Follower Pool ~$0.083/hour ($60/month)')
    })

    it('allows the user to correct the follower level after initial selection', async function () {
      promptStub
        .onCall(0).resolves({level: levelsResponse.items[0].name}) // Follower level selection
        .onCall(1).resolves({action: '__go_back'}) // Go back to level selection
        .onCall(2).resolves({level: levelsResponse.items[1].name}) // Follower level selection
        .onCall(3).resolves({action: '1'}) // Follower count selection (select 1 instance)
        .onCall(4).resolves({action: '__yes'}) // Name the follower pool? (yes)
        .onCall(5).resolves({name: 'readonly'}) // Name the follower pool
        .onCall(6).resolves({action: '__confirm'}) // Confirmation

      const poolConfig = new PoolConfig(extendedLevelsInfo, 1)
      stdout.start()
      stderr.start()
      const {count, level, name} = await poolConfig.followerInteractiveConfig()
      stderr.stop()
      stdout.stop()
      expect(level).to.equal(levelsResponse.items[1].name)
      expect(count).to.equal(1)
      expect(name).to.equal('readonly')
    })

    it('allows the user to correct the follower count after initial selection', async function () {
      promptStub
        .onCall(0).resolves({level: levelsResponse.items[0].name}) // Follower level selection
        .onCall(1).resolves({action: '1'}) // Follower count selection (select 1 instance)
        .onCall(2).resolves({action: '__go_back'}) // Go back to count selection
        .onCall(3).resolves({action: '2'}) // Follower count selection (select 2 instances)
        .onCall(4).resolves({action: '__yes'}) // Name the follower pool? (yes)
        .onCall(5).resolves({name: 'readonly'}) // Name the follower pool
        .onCall(6).resolves({action: '__confirm'}) // Confirmation

      const poolConfig = new PoolConfig(extendedLevelsInfo, 1)
      stdout.start()
      stderr.start()
      const {count, level, name} = await poolConfig.followerInteractiveConfig()
      stderr.stop()
      stdout.stop()
      expect(level).to.equal(levelsResponse.items[0].name)
      expect(count).to.equal(2)
      expect(name).to.equal('readonly')
    })

    it('allows the user to correct the follower pool name after initial selection', async function () {
      promptStub
        .onCall(0).resolves({level: levelsResponse.items[0].name}) // Follower level selection
        .onCall(1).resolves({action: '1'}) // Follower count selection (select 1 instance)
        .onCall(2).resolves({action: '__yes'}) // Name the follower pool? (yes)
        .onCall(3).resolves({name: 'readonly'}) // Name the follower pool
        .onCall(4).resolves({action: '__go_back'}) // Go back to name selection
        .onCall(5).resolves({action: '__yes'}) // Name the follower pool? (yes)
        .onCall(6).resolves({name: 'analytics'}) // Name the follower pool
        .onCall(7).resolves({action: '__confirm'}) // Confirmation

      const poolConfig = new PoolConfig(extendedLevelsInfo, 1)
      stdout.start()
      stderr.start()
      const {count, level, name} = await poolConfig.followerInteractiveConfig()
      stderr.stop()
      stdout.stop()
      expect(level).to.equal(levelsResponse.items[0].name)
      expect(count).to.equal(1)
      expect(name).to.equal('analytics')
    })
  })

  describe('leaderInteractiveConfig', function () {
    it('allows the user to configure a leader pool', async function () {
      promptStub
        .onCall(0).resolves({level: levelsResponse.items[0].name}) // Follower level selection
        .onCall(1).resolves({action: '__keep'}) // High availability selection (keep high availability)
        .onCall(2).resolves({action: '__confirm'}) // Confirmation

      const poolConfig = new PoolConfig(extendedLevelsInfo, 1)
      stdout.start()
      stderr.start()
      const {highAvailability, level} = await poolConfig.leaderInteractiveConfig()
      stderr.stop()
      stdout.stop()
      expect(level).to.equal(levelsResponse.items[0].name)
      expect(highAvailability).to.be.true
      expect(stderr.output).to.contain('The leader pool has high availability enabled and includes a standby instance for redundancy.')
      expect(stderr.output).to.contain('Configure Leader Pool ~$0.167/hour ($120/month)')
    })

    it('allows the user to correct the leader level after initial selection', async function () {
      promptStub
        .onCall(0).resolves({level: levelsResponse.items[0].name}) // Leader level selection
        .onCall(1).resolves({action: '__go_back'}) // Go back to level selection
        .onCall(2).resolves({level: levelsResponse.items[1].name}) // Leader level selection
        .onCall(3).resolves({action: '__keep'}) // High availability selection (keep high availability)
        .onCall(4).resolves({action: '__confirm'}) // Confirmation

      const poolConfig = new PoolConfig(extendedLevelsInfo, 1)
      stdout.start()
      stderr.start()
      const {highAvailability, level} = await poolConfig.leaderInteractiveConfig()
      stderr.stop()
      stdout.stop()
      expect(level).to.equal(levelsResponse.items[1].name)
      expect(highAvailability).to.be.true
    })

    it('allows the user to correct the high availability after initial selection', async function () {
      promptStub
        .onCall(0).resolves({level: levelsResponse.items[0].name}) // Leader level selection
        .onCall(1).resolves({action: '__keep'}) // High availability selection (keep high availability)
        .onCall(2).resolves({action: '__go_back'}) // Go back to high availability selection
        .onCall(3).resolves({action: '__remove'}) // High availability selection (remove high availability)
        .onCall(4).resolves({action: '__confirm'}) // Confirmation

      const poolConfig = new PoolConfig(extendedLevelsInfo, 1)
      stdout.start()
      stderr.start()
      const {highAvailability, level} = await poolConfig.leaderInteractiveConfig()
      stderr.stop()
      stdout.stop()
      expect(level).to.equal(levelsResponse.items[0].name)
      expect(highAvailability).to.be.false
    })
  })
})
