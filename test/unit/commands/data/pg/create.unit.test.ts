import {runCommand} from '@heroku-cli/test-utils'
import {HerokuSDK} from '@heroku/sdk'
import {AddonConfirmationRequiredError} from '@heroku/sdk/resources/platform/add-on'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {restore, SinonStub, stub} from 'sinon'
import tsheredoc from 'tsheredoc'

import DataPgCreate from '../../../../../src/commands/data/pg/create.js'
import ConfirmCommand from '../../../../../src/lib/confirm-command.js'
import PoolConfig from '../../../../../src/lib/data/pool-config.js'
import {clearLevelsAndPricingCache} from '../../../../../src/lib/data/utils.js'
import {
  createAddonResponse,
  createPoolResponse,
  levelsResponse,
  pricingResponse,
} from '../../../../fixtures/data/pg/fixtures.js'

const heredoc = tsheredoc

interface FakeData {
  postgres: {provisionAdvanced: SinonStub}
  postgresPool: {create: SinonStub}
}

type ProvisionBody = {
  [key: string]: unknown
  config?: Record<string, unknown>
  followers?: number
}

type ProvisionOptions = {
  onPoll?: (status: unknown) => void
  onProvisioning?: (addon: unknown) => Promise<void> | void
  wait?: boolean
}

// The command owns flag parsing, the interactive level/pool prompts, the
// spinner, and output rendering, but delegates create + optional wait-poll +
// follower-pool creation to data.postgres.provisionAdvanced and the interactive
// follower loop to data.postgresPool.create. This fake stands in for
// provisionAdvanced: it returns the created leader add-on (and, when the caller
// bundled `followers`, the follower pool), driving the wait hooks only when
// `wait` is set — so the command's UX branches are exercised without any HTTP.
const provisionResolving = (addon = createAddonResponse, pool = createPoolResponse) =>
  async (_app: string, body: ProvisionBody, options: ProvisionOptions = {}) => {
    if (options.wait) {
      await options.onProvisioning?.(addon)
      options.onPoll?.(createPoolResponse.wait_status)
    }

    return {addon, pool: body.followers && body.followers > 0 ? pool : undefined}
  }

describe('data:pg:create', function () {
  let fakeData: FakeData
  let promptStub: SinonStub
  let notifyStub: SinonStub
  let poolConfigStubs: {
    followerInteractiveConfig: SinonStub
    instanceCountStep: SinonStub
    leaderInteractiveConfig: SinonStub
    levelStep: SinonStub
  }

  beforeEach(function () {
    fakeData = {
      postgres: {provisionAdvanced: stub().callsFake(provisionResolving())},
      postgresPool: {create: stub().resolves(createPoolResponse)},
    }
    stub(HerokuSDK.prototype, 'data').get(() => fakeData)

    promptStub = stub()

    // Create stubs for PoolConfig methods
    poolConfigStubs = {
      followerInteractiveConfig: stub(),
      instanceCountStep: stub(),
      leaderInteractiveConfig: stub(),
      levelStep: stub(),
    }

    stub(PoolConfig.prototype, 'followerInteractiveConfig').callsFake(poolConfigStubs.followerInteractiveConfig)
    stub(PoolConfig.prototype, 'instanceCountStep').callsFake(poolConfigStubs.instanceCountStep)
    stub(PoolConfig.prototype, 'leaderInteractiveConfig').callsFake(poolConfigStubs.leaderInteractiveConfig)
    stub(PoolConfig.prototype, 'levelStep').callsFake(poolConfigStubs.levelStep)
    stub(DataPgCreate.prototype, 'prompt').callsFake(promptStub)
    stub(DataPgCreate.prototype, 'runCommand').resolves()
    notifyStub = stub(DataPgCreate.prototype, 'notify').resolves()
  })

  afterEach(function () {
    clearLevelsAndPricingCache()
    restore()
  })

  describe('non-interactive mode (--level flag provided)', function () {
    it('creates an advanced database', async function () {
      const {stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance'])

      const [app, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(app).to.equal('myapp')
      expect(body.level).to.equal('4G-Performance')
      expect(body.network).to.be.undefined
      expect(body.followers).to.be.undefined
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
      `))
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })

    it('creates database with a follower pool', async function () {
      const {stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance', '--followers=2'])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.level).to.equal('4G-Performance')
      expect(body.followers).to.equal(2)
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        Success: we're provisioning readers follower pool on advanced-horizontal-01234.
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

      `))
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })

    it('creates database in private network', async function () {
      await runCommand(DataPgCreate, ['--app=myapp', '--network=private', '--level=4G-Performance'])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.level).to.equal('4G-Performance')
      expect(body.network).to.equal('private')
    })

    it('creates database in shield network', async function () {
      await runCommand(DataPgCreate, ['--app=myapp', '--network=shield', '--level=4G-Performance'])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.level).to.equal('4G-Performance')
      expect(body.network).to.equal('shield')
    })

    it('creates database with provision options', async function () {
      await runCommand(DataPgCreate, [
        '--app=myapp',
        '--level=4G-Performance',
        '--provision-option=follow:otherdb',
        '--provision-option=rollback:true',
        '--provision-option=foo:',
        '--provision-option=bar',
        '--provision-option=key:value:with:colons',
        '--provision-option=timestamp:2025-11-17T15:20:00',
      ])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.level).to.equal('4G-Performance')
      expect(body.config).to.deep.equal({
        bar: 'true',
        follow: 'otherdb',
        foo: 'true',
        key: 'value:with:colons',
        rollback: 'true',
        timestamp: '2025-11-17T15:20:00',
      })
    })

    it('creates database with confirm flag', async function () {
      const {stderr} = await runCommand(DataPgCreate, [
        '--app=myapp',
        '--level=4G-Performance',
        '--confirm=myapp',
        '--high-availability',
      ])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.level).to.equal('4G-Performance')
      expect(body.confirm).to.equal('myapp')
      expect(body.highAvailability).to.equal(true)
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })

    it('runs the two-phase wait UX and notifies on success with --wait', async function () {
      const {error, stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance', '--wait'])

      expect(error).to.be.undefined
      expect(fakeData.postgres.provisionAdvanced.firstCall.args[2].wait).to.be.true
      // Create phase closes, then the wait phase wraps the poll loop.
      expect(ansis.strip(stderr)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
        Creating advanced-horizontal-01234... done
      `)
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        Waiting for advanced-horizontal-01234...
        Created advanced-horizontal-01234
      `))
      expect(notifyStub.calledOnceWith('We successfully provisioned the database')).to.be.true
    })

    it('notifies on failure when --wait provisioning fails', async function () {
      const waitError = new Error('wait polling failed')
      fakeData.postgres.provisionAdvanced.callsFake(async () => ({addon: createAddonResponse, waitError}))

      const {error} = await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance', '--wait'])

      expect(error).to.equal(waitError)
      expect(notifyStub.calledOnce).to.be.true
      expect(notifyStub.firstCall.args[1]).to.be.false
    })
  })

  describe('confirmation prompt retry', function () {
    it('prompts for confirmation then retries the provision with the app as confirmation', async function () {
      const confirmStub = stub(ConfirmCommand.prototype, 'confirm').resolves()
      fakeData.postgres.provisionAdvanced
        .onFirstCall().rejects(new AddonConfirmationRequiredError('confirmation required'))
        .onSecondCall().callsFake(provisionResolving())

      const {error, stdout} = await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance'])

      expect(error).to.be.undefined
      expect(confirmStub.calledOnce).to.be.true
      expect(fakeData.postgres.provisionAdvanced.calledTwice).to.be.true
      // First attempt carries no confirmation; the retry passes the app name.
      expect(fakeData.postgres.provisionAdvanced.firstCall.args[1].confirm).to.be.undefined
      expect(fakeData.postgres.provisionAdvanced.secondCall.args[1].confirm).to.equal('myapp')
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
      `))
    })
  })

  describe('partial provisioning failure', function () {
    // provisionAdvanced keeps the created leader and reports a post-creation
    // failure on the result instead of throwing. The command must still surface
    // these as a failed run (today's behavior), so the helper rethrows them.
    it('surfaces a captured wait failure as a thrown error', async function () {
      const waitError = new Error('wait polling failed')
      fakeData.postgres.provisionAdvanced.callsFake(async () => ({addon: createAddonResponse, waitError}))

      const {error} = await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance', '--wait'])

      expect(error).to.equal(waitError)
    })

    it('surfaces a captured follower-pool failure as a thrown error', async function () {
      const poolError = new Error('follower pool create failed')
      fakeData.postgres.provisionAdvanced.callsFake(async () => ({addon: createAddonResponse, poolError}))

      const {error} = await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance', '--followers=2'])

      expect(error).to.equal(poolError)
    })
  })

  describe('interactive mode (--level flag omitted)', function () {
    beforeEach(function () {
      nock('https://api.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
    })

    it('provisions a database with high availability, without follower pools', async function () {
      poolConfigStubs.leaderInteractiveConfig.resolves({
        highAvailability: true,
        level: levelsResponse.items[0].name,
      }) // Leader pool config
      promptStub.onCall(0).resolves({action: 'exit'}) // Exit at follower pool configuration

      const {stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp'])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.level).to.equal(levelsResponse.items[0].name)
      expect(body.highAvailability).to.equal(true)
      expect(body.followers).to.be.undefined
      expect(fakeData.postgresPool.create.called).to.be.false
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
      `))
      expect(ansis.strip(stderr)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('provisions a database with provision options in interactive mode', async function () {
      poolConfigStubs.leaderInteractiveConfig.resolves({
        highAvailability: true,
        level: levelsResponse.items[0].name,
      }) // Leader pool config
      promptStub.onCall(0).resolves({action: 'exit'}) // Exit at follower pool configuration

      await runCommand(DataPgCreate, [
        '--app=myapp',
        '--provision-option=rollback:true',
        '--provision-option=follow:otherdb',
        '--provision-option=foo:true',
      ])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.level).to.equal(levelsResponse.items[0].name)
      expect(body.highAvailability).to.equal(true)
      expect(body.config).to.deep.equal({
        follow: 'otherdb',
        foo: 'true',
        rollback: 'true',
      })
    })

    it('allows the user to remove the high availability standby', async function () {
      poolConfigStubs.leaderInteractiveConfig.resolves({
        highAvailability: false,
        level: levelsResponse.items[0].name,
      }) // Leader pool config
      promptStub.onCall(0).resolves({action: 'exit'}) // Exit at follower pool configuration

      const {stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp'])

      const [, body] = fakeData.postgres.provisionAdvanced.firstCall.args
      expect(body.highAvailability).to.equal(false)
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
      `))
      expect(ansis.strip(stderr)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('allows the user to configure a follower pool', async function () {
      poolConfigStubs.leaderInteractiveConfig.resolves({
        highAvailability: true,
        level: levelsResponse.items[0].name,
      }) // Leader pool config
      poolConfigStubs.followerInteractiveConfig.resolves({
        count: 2,
        level: levelsResponse.items[0].name,
        name: 'readonly',
      }) // Follower pool configuration
      promptStub
        .onCall(0).resolves({action: 'configure'}) // Configure a follower pool
        .onCall(1).resolves({oneMore: false}) // One more? (no)

      const {stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp'])

      expect(fakeData.postgresPool.create.calledOnce).to.be.true
      const [addonId, poolBody] = fakeData.postgresPool.create.firstCall.args
      expect(addonId).to.equal(createAddonResponse.id)
      expect(poolBody).to.deep.equal({count: 2, level: levelsResponse.items[0].name, name: 'readonly'})
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        Success: we're provisioning readers follower pool on advanced-horizontal-01234.
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

      `))
      expect(ansis.strip(stderr)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('allows the user to configure more than one follower pool', async function () {
      poolConfigStubs.leaderInteractiveConfig.resolves({
        highAvailability: true,
        level: levelsResponse.items[0].name,
      }) // Leader pool config
      poolConfigStubs.followerInteractiveConfig
        .onCall(0).resolves({
          count: 2,
          level: levelsResponse.items[0].name,
          name: 'readonly',
        }) // First follower pool configuration
        .onCall(1).resolves({
          count: 1,
          level: levelsResponse.items[0].name,
          name: 'readonly2',
        }) // Second follower pool configuration
      fakeData.postgresPool.create
        .onCall(0).resolves({...createPoolResponse, name: 'readonly'})
        .onCall(1).resolves({...createPoolResponse, name: 'readonly2'})
      promptStub
        .onCall(0).resolves({action: 'configure'}) // Configure a follower pool
        .onCall(1).resolves({oneMore: true}) // One more? (yes)
        .onCall(2).resolves({action: 'configure'}) // Configure another follower pool
        .onCall(3).resolves({oneMore: false}) // One more? (no)

      const {stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp'])

      expect(fakeData.postgresPool.create.calledTwice).to.be.true
      expect(fakeData.postgresPool.create.firstCall.args[1]).to.deep.equal({count: 2, level: levelsResponse.items[0].name, name: 'readonly'})
      expect(fakeData.postgresPool.create.secondCall.args[1]).to.deep.equal({count: 1, level: levelsResponse.items[0].name, name: 'readonly2'})
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        Success: we're provisioning readonly follower pool on advanced-horizontal-01234.
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

        Success: we're provisioning readonly2 follower pool on advanced-horizontal-01234.
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

      `))
      expect(ansis.strip(stderr)).to.contain(heredoc`
        Configuring follower pool... done


        Configuring follower pool... done
      `)
      expect(ansis.strip(stderr)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('doesn\'t ask to configure another follower pool when the maximum number of follower pools is reached', async function () {
      poolConfigStubs.leaderInteractiveConfig.resolves({
        highAvailability: true,
        level: levelsResponse.items[0].name,
      }) // Leader pool config
      poolConfigStubs.followerInteractiveConfig
        .onCall(0).resolves({
          count: 13,
          level: levelsResponse.items[0].name,
          name: 'readonly',
        }) // Follower pool configuration
      fakeData.postgresPool.create.resolves({...createPoolResponse, name: 'readonly'})
      promptStub.onCall(0).resolves({action: 'configure'}) // Configure a follower pool

      const {stderr, stdout} = await runCommand(DataPgCreate, ['--app=myapp'])

      // No "configure another?" prompt fires once the cluster hits 13 instances.
      expect(promptStub.calledOnce).to.be.true
      expect(fakeData.postgresPool.create.calledOnce).to.be.true
      expect(fakeData.postgresPool.create.firstCall.args[1]).to.deep.equal({count: 13, level: levelsResponse.items[0].name, name: 'readonly'})
      expect(stdout).to.equal(heredoc(`
        Your database is being provisioned
        advanced-horizontal-01234 is being created in the background. The app will restart when complete...
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        Success: we're provisioning readonly follower pool on advanced-horizontal-01234.
        Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

      `))
      expect(ansis.strip(stderr)).to.contain(heredoc`
        Configuring follower pool... done
      `)
      expect(ansis.strip(stderr)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })
  })
})
