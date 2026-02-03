import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import DataPgCreate from '../../../../../src/commands/data/pg/create.js'
import PoolConfig from '../../../../../src/lib/data/poolConfig.js'
import {clearLevelsAndPricingCache} from '../../../../../src/lib/data/utils.js'
import {
  createAddonResponse,
  createPoolResponse,
  levelsResponse,
  pricingResponse,
} from '../../../../fixtures/data/pg/fixtures.js'
import runCommand from '../../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

describe('data:pg:create', function () {
  let promptStub: sinon.SinonStub
  let poolConfigStubs: {
    followerInteractiveConfig: sinon.SinonStub
    instanceCountStep: sinon.SinonStub
    levelStep: sinon.SinonStub
  }

  beforeEach(function () {
    promptStub = sinon.stub()

    // Create stubs for PoolConfig methods
    poolConfigStubs = {
      followerInteractiveConfig: sinon.stub(),
      instanceCountStep: sinon.stub(),
      levelStep: sinon.stub(),
    }

    sinon.stub(PoolConfig.prototype, 'followerInteractiveConfig').callsFake(poolConfigStubs.followerInteractiveConfig)
    sinon.stub(PoolConfig.prototype, 'instanceCountStep').callsFake(poolConfigStubs.instanceCountStep)
    sinon.stub(PoolConfig.prototype, 'levelStep').callsFake(poolConfigStubs.levelStep)
    sinon.stub(DataPgCreate.prototype, 'prompt').callsFake(promptStub)
    sinon.stub(DataPgCreate.prototype, 'runCommand').resolves()
  })

  afterEach(function () {
    clearLevelsAndPricingCache()
    sinon.restore()
  })

  describe('non-interactive mode (--level flag provided)', function () {
    it('creates an advanced database', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons')
        .reply(200, createAddonResponse)
      await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance'])

      herokuApi.done()
      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        `),
      )
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })

    it('creates database with a follower pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {level: '4G-Performance'},
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)
      const dataApi = nock('https://test.data.heroku.com')
        .post(`/data/postgres/v1/${createAddonResponse.id}/pools`, {
          count: 2,
          level: '4G-Performance',
        })
        .reply(200, createPoolResponse)

      await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance', '--followers=2'])

      herokuApi.done()
      dataApi.done()
      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
          Success: we're provisioning readers follower pool on advanced-horizontal-01234.
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

        `),
      )
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })

    it('creates database in private network', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {level: '4G-Performance'},
          plan: {name: 'heroku-postgresql:advanced-private-beta'},
        })
        .reply(200, createAddonResponse)

      await runCommand(DataPgCreate, [
        '--app=myapp',
        '--network=private',
        '--level=4G-Performance',
      ])

      herokuApi.done()
      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
      `),
      )
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })

    it('creates database in shield network', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {level: '4G-Performance'},
          plan: {name: 'heroku-postgresql:advanced-shield-beta'},
        })
        .reply(200, createAddonResponse)

      await runCommand(DataPgCreate, [
        '--app=myapp',
        '--network=shield',
        '--level=4G-Performance',
      ])

      herokuApi.done()
      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
      `),
      )
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })

    describe('with HEROKU_PROD_NGPG env var set', function () {
      let originalEnv: NodeJS.ProcessEnv

      beforeEach(function () {
        originalEnv = {...process.env}
        process.env.HEROKU_PROD_NGPG = 'true'
      })

      afterEach(function () {
        process.env = originalEnv
      })

      it('creates database with non-beta plan', async function () {
        const herokuApi = nock('https://api.heroku.com')
          .post('/apps/myapp/addons', {
            attachment: {},
            config: {level: '4G-Performance'},
            plan: {name: 'heroku-postgresql:advanced'},
          })
          .reply(200, createAddonResponse)

        await runCommand(DataPgCreate, ['--app=myapp', '--level=4G-Performance'])

        herokuApi.done()
      })

      it('creates database in private network with non-beta plan', async function () {
        const herokuApi = nock('https://api.heroku.com')
          .post('/apps/myapp/addons', {
            attachment: {},
            config: {level: '4G-Performance'},
            plan: {name: 'heroku-postgresql:advanced-private'},
          })
          .reply(200, createAddonResponse)

        await runCommand(DataPgCreate, [
          '--app=myapp',
          '--network=private',
          '--level=4G-Performance',
        ])

        herokuApi.done()
      })

      it('creates database in shield network with non-beta plan', async function () {
        const herokuApi = nock('https://api.heroku.com')
          .post('/apps/myapp/addons', {
            attachment: {},
            config: {level: '4G-Performance'},
            plan: {name: 'heroku-postgresql:advanced-shield'},
          })
          .reply(200, createAddonResponse)

        await runCommand(DataPgCreate, [
          '--app=myapp',
          '--network=shield',
          '--level=4G-Performance',
        ])

        herokuApi.done()
      })

      it('uses non-beta pricing in interactive mode', async function () {
        const herokuApi = nock('https://api.heroku.com')
          .post('/apps/myapp/addons', {
            attachment: {},
            config: {
              'high-availability': true,
              level: levelsResponse.items[0].name,
            },
            plan: {name: 'heroku-postgresql:advanced'},
          })
          .reply(200, createAddonResponse)

        const dataApi = nock('https://test.data.heroku.com')
          .get('/data/postgres/v1/levels/advanced')
          .reply(200, levelsResponse)
          .get('/data/postgres/v1/pricing')
          .reply(200, pricingResponse)

        poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Level selection
        promptStub
          .onCall(0).resolves({action: 'keep'}) // High availability selection
          .onCall(1).resolves({action: 'confirm'}) // Confirmation
          .onCall(2).resolves({action: 'exit'}) // Exit at follower pool configuration

        await runCommand(DataPgCreate, ['--app=myapp'])

        herokuApi.done()
        dataApi.done()
      })
    })

    it('creates database with provision options', async function () {
      const herokuApi = nock('https://api.heroku.com')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .post('/apps/myapp/addons', (body: any) => body.config.level === '4G-Performance'
            && body.config.follow === 'otherdb'
            && body.config.rollback === 'true'
            && body.config.foo === 'true'
            && body.config.bar === 'true'
            && body.config.key === 'value:with:colons'
            && body.config.timestamp === '2025-11-17T15:20:00')
        .reply(200, createAddonResponse)

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

      herokuApi.done()
    })

    it('creates database with confirm flag', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': true,
            level: '4G-Performance',
          },
          confirm: 'myapp',
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      await runCommand(DataPgCreate, [
        '--app=myapp',
        '--level=4G-Performance',
        '--confirm=myapp',
        '--high-availability',
      ])

      herokuApi.done()
      expect(ansis.strip(stderr.output)).to.equal(heredoc`
        Creating a 4G-Performance database on ⬢ myapp... done
      `)
    })
  })

  describe('interactive mode (--level flag omitted)', function () {
    it('provisions a database with high availability, without follower pools', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': true,
            level: levelsResponse.items[0].name,
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Level selection
      promptStub
        .onCall(0).resolves({action: 'keep'}) // High availability selection
        .onCall(1).resolves({action: 'confirm'}) // Confirmation
        .onCall(2).resolves({action: 'exit'}) // Exit at follower pool configuration

      await runCommand(DataPgCreate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()

      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        `),
      )
      expect(ansis.strip(stderr.output)).to.contain('4G-Performance 2 vCPU 4 GB MEM ~$0.083/hour ($60/month)')
      expect(ansis.strip(stderr.output)).to.contain('Standby (High Availability) ~$0.083/hour ($60/month)')
      expect(ansis.strip(stderr.output)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('provisions a database with provision options in interactive mode', async function () {
      const herokuApi = nock('https://api.heroku.com')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .post('/apps/myapp/addons', (body: any) => body.config.level === levelsResponse.items[0].name
            && body.config['high-availability'] === true
            && body.config.follow === 'otherdb'
            && body.config.rollback === 'true'
            && body.config.foo === 'true')
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Level selection
      promptStub
        .onCall(0).resolves({action: 'keep'}) // High availability selection
        .onCall(1).resolves({action: 'confirm'}) // Confirmation
        .onCall(2).resolves({action: 'exit'}) // Exit at follower pool configuration

      await runCommand(DataPgCreate, [
        '--app=myapp',
        '--provision-option=rollback:true',
        '--provision-option=follow:otherdb',
        '--provision-option=foo:true',
      ])

      herokuApi.done()
      dataApi.done()
    })

    it('allows the user to remove the high availability standby', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': false,
            level: levelsResponse.items[0].name,
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Level selection
      promptStub
        .onCall(0).resolves({action: 'remove'}) // High availability selection
        .onCall(1).resolves({action: 'confirm'}) // Confirmation
        .onCall(2).resolves({action: 'exit'}) // Exit at follower pool configuration

      await runCommand(DataPgCreate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()

      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        `),
      )
      expect(ansis.strip(stderr.output)).to.contain('4G-Performance 2 vCPU 4 GB MEM ~$0.083/hour ($60/month)')
      expect(ansis.strip(stderr.output)).not.to.contain('Standby (High Availability) ~$0.083/hour ($60/month)')
      expect(ansis.strip(stderr.output)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('allows the user to correct the leader level after initial selection', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': true,
            level: levelsResponse.items[1].name,
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      poolConfigStubs.levelStep
        .onCall(0).resolves(levelsResponse.items[0].name) // Level selection
        .onCall(1).resolves(levelsResponse.items[1].name) // Level selection (selects a different level)
      promptStub
        .onCall(0).resolves({action: 'back'}) // High availability selection (go back to leader level selection)
        .onCall(1).resolves({action: 'keep'}) // High availability selection (keep high availability)
        .onCall(2).resolves({action: 'confirm'}) // Confirmation
        .onCall(3).resolves({action: 'exit'}) // Exit at follower pool configuration

      await runCommand(DataPgCreate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()

      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        `),
      )
      expect(ansis.strip(stderr.output)).to.contain('8G-Performance 4 vCPU 8 GB MEM ~$0.278/hour ($200/month)')
      expect(ansis.strip(stderr.output)).to.contain('Standby (High Availability) ~$0.278/hour ($200/month)')
      expect(ansis.strip(stderr.output)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('allows the user to correct the high availability after initial selection', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': false,
            level: levelsResponse.items[0].name,
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)

      poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Level selection
      promptStub
        .onCall(0).resolves({action: 'keep'}) // High availability selection (keep high availability)
        .onCall(1).resolves({action: 'back'}) // Confirmation (go back to high availability selection)
        .onCall(2).resolves({action: 'remove'}) // High availability selection (remove high availability)
        .onCall(3).resolves({action: 'confirm'}) // Confirmation
        .onCall(4).resolves({action: 'exit'}) // Exit at follower pool configuration

      await runCommand(DataPgCreate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()

      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
        `),
      )
      expect(ansis.strip(stderr.output)).to.contain('Configure Leader Pool ~$0.167/hour ($120/month)')
      expect(ansis.strip(stderr.output)).to.contain('Configure Leader Pool ~$0.083/hour ($60/month)')
      expect(ansis.strip(stderr.output)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('allows the user to configure a follower pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': true,
            level: levelsResponse.items[0].name,
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
        .post(`/data/postgres/v1/${createAddonResponse.id}/pools`, {
          count: 2,
          level: levelsResponse.items[0].name,
          name: 'readonly',
        })
        .reply(200, createPoolResponse)

      poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Leader level selection
      poolConfigStubs.followerInteractiveConfig.resolves({
        count: 2,
        level: levelsResponse.items[0].name,
        name: 'readonly',
      }) // Follower pool configuration
      promptStub
        .onCall(0).resolves({action: 'keep'}) // High availability selection (keep high availability)
        .onCall(1).resolves({action: 'confirm'}) // Confirmation
        .onCall(2).resolves({action: 'configure'}) // Configure a follower pool
        .onCall(3).resolves({oneMore: false}) // One more? (no)

      await runCommand(DataPgCreate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()

      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
          Success: we're provisioning readers follower pool on advanced-horizontal-01234.
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

        `),
      )
      expect(ansis.strip(stderr.output)).to.contain('Configure Leader Pool ~$0.167/hour ($120/month)')
      expect(ansis.strip(stderr.output)).to.contain('Configuring follower pool... done')
      expect(ansis.strip(stderr.output)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('allows the user to configure more than one follower pool', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': true,
            level: levelsResponse.items[0].name,
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
        .post(`/data/postgres/v1/${createAddonResponse.id}/pools`, {
          count: 2,
          level: levelsResponse.items[0].name,
          name: 'readonly',
        })
        .reply(200, {...createPoolResponse, name: 'readonly'})
        .post(`/data/postgres/v1/${createAddonResponse.id}/pools`, {
          count: 1,
          level: levelsResponse.items[0].name,
          name: 'readonly2',
        })
        .reply(200, {...createPoolResponse, name: 'readonly2'})

      poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Leader level selection
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
      promptStub
        .onCall(0).resolves({action: 'keep'}) // High availability selection (keep high availability)
        .onCall(1).resolves({action: 'confirm'}) // Confirmation
        .onCall(2).resolves({action: 'configure'}) // Configure a follower pool
        .onCall(3).resolves({oneMore: true}) // One more? (yes)
        .onCall(4).resolves({action: 'configure'}) // Configure another follower pool
        .onCall(5).resolves({oneMore: false}) // One more? (no)

      await runCommand(DataPgCreate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()

      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
          Success: we're provisioning readonly follower pool on advanced-horizontal-01234.
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

          Success: we're provisioning readonly2 follower pool on advanced-horizontal-01234.
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

        `),
      )
      expect(ansis.strip(stderr.output)).to.contain('Configure Leader Pool ~$0.167/hour ($120/month)')
      expect(ansis.strip(stderr.output)).to.contain(heredoc`
        Configuring follower pool... done
        
        
        Configuring follower pool... done
      `)
      expect(ansis.strip(stderr.output)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })

    it('doesn\'t ask to configure another follower pool when the maximum number of follower pools is reached', async function () {
      const herokuApi = nock('https://api.heroku.com')
        .post('/apps/myapp/addons', {
          attachment: {},
          config: {
            'high-availability': true,
            level: levelsResponse.items[0].name,
          },
          plan: {name: 'heroku-postgresql:advanced-beta'},
        })
        .reply(200, createAddonResponse)

      const dataApi = nock('https://test.data.heroku.com')
        .get('/data/postgres/v1/levels/advanced')
        .reply(200, levelsResponse)
        .get('/data/postgres/v1/pricing')
        .reply(200, pricingResponse)
        .post(`/data/postgres/v1/${createAddonResponse.id}/pools`, {
          count: 13,
          level: levelsResponse.items[0].name,
          name: 'readonly',
        })
        .reply(200, {...createPoolResponse, name: 'readonly'})

      poolConfigStubs.levelStep.resolves(levelsResponse.items[0].name) // Leader level selection
      poolConfigStubs.followerInteractiveConfig
        .onCall(0).resolves({
          count: 13,
          level: levelsResponse.items[0].name,
          name: 'readonly',
        }) // Follower pool configuration
      promptStub
        .onCall(0).resolves({action: 'keep'}) // High availability selection (keep high availability)
        .onCall(1).resolves({action: 'confirm'}) // Confirmation
        .onCall(2).resolves({action: 'configure'}) // Configure a follower pool

      await runCommand(DataPgCreate, ['--app=myapp'])

      herokuApi.done()
      dataApi.done()

      expect(stdout.output).to.equal(
        heredoc(`
          Your database is being provisioned
          advanced-horizontal-01234 is being created in the background. The app will restart when complete...
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.
          Success: we're provisioning readonly follower pool on advanced-horizontal-01234.
          Run heroku data:pg:info advanced-horizontal-01234 -a myapp to check creation progress.

        `),
      )
      expect(ansis.strip(stderr.output)).to.contain('Configure Leader Pool ~$0.167/hour ($120/month)')
      expect(ansis.strip(stderr.output)).to.contain(heredoc`
        Configuring follower pool... done
      `)
      expect(ansis.strip(stderr.output)).to.contain('Running heroku data:pg:info advanced-horizontal-01234 --app=myapp...')
    })
  })
})
