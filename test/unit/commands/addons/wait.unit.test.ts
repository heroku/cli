import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import _ from 'lodash'
import nock from 'nock'
import {createSandbox, type SinonFakeTimers, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/wait.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('addons:wait', function () {
  let sandbox: any
  let clock: SinonFakeTimers
  let sdkMock: MockSDK

  beforeEach(function () {
    sandbox = createSandbox()
    nock.cleanAll()
    // Fake only Date so the >5s notifier threshold can be advanced
    // synchronously without faking setTimeout (the SDK's polling loop
    // needs real setTimeout to drive the test forward).
    clock = sandbox.useFakeTimers({shouldAdvanceTime: true, toFake: ['Date']})
  })

  afterEach(function () {
    sandbox.restore()
    sdkMock?.restore()
    nock.cleanAll()
  })
  context('waiting for an individual add-on to provision', function () {
    context('when the add-on is provisioned', function () {
      beforeEach(function () {
        // resolveAddon uses this.heroku to POST /actions/addons/resolve
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-db', app: null})
          .reply(200, [fixtures.addons['www-db']])
        // No SDK polling needed since www-db is already provisioned
        const infoByAppStub = stub().resolves(fixtures.addons['www-db'])
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })
      })
      it('prints output indicating that it is done', async function () {
        const {stderr, stdout} = await runCommand(Cmd, [
          'www-db',
        ])
        expectOutput(stdout, '')
        expectOutput(stderr, '')
      })
    })
    context('for an add-on that is still provisioning', function () {
      it('waits until the add-on is provisioned, then shows config vars', async function () {
        // resolveAddon uses this.heroku
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis', app: null})
          .reply(200, [fixtures.addons['www-redis']])

        // waitForAddonProvisioning uses SDK for polling
        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']
        const infoByAppStub = stub()
          .onFirstCall().resolves(fixtures.addons['www-redis'])
          .onSecondCall().resolves(provisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        const {stderr, stdout} = await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis',
        ])
        expectOutput(stderr, `
Creating www-redis... done
`)
        expectOutput(stdout, `
Created www-redis as REDIS_URL
`)
      })
      it('does NOT notify the user when provisioning takes less than 5 seconds', async function () {
        const notifySpy = sandbox.spy(Cmd, 'notifier')
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis', app: null})
          .reply(200, [fixtures.addons['www-redis']])

        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']
        const infoByAppStub = stub().resolves(provisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis',
        ])
        expect(notifySpy.called).to.be.false
        expect(notifySpy.calledOnce).to.be.false
      })
      it('notifies the user when provisioning takes longer than 5 seconds', async function () {
        const notifySpy = sandbox.spy(Cmd, 'notifier')

        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis', app: null})
          .reply(200, [fixtures.addons['www-redis']])

        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']
        const infoByAppStub = stub().callsFake(() => {
          clock.tick(5000)
          return Promise.resolve(provisionedAddon)
        })
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis',
        ])
        expect(notifySpy.called).to.be.true
        expect(notifySpy.calledOnce).to.be.true
      })
    })
    context('when add-on transitions to deprovisioned state', function () {
      it('shows notification', async function () {
        const notifySpy = sandbox.spy(Cmd, 'notifier')

        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis', app: null})
          .reply(200, [fixtures.addons['www-redis']])

        // waitForAddonProvisioning uses SDK - returns deprovisioned
        const deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'
        const infoByAppStub = stub().resolves(deprovisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        await runCommand(Cmd, ['www-redis'])
          .catch(error => {
            expect(error.message).to.equal('The add-on was unable to be created, with status deprovisioned')
            expect(notifySpy.called).to.be.true
            expect(notifySpy.calledOnce).to.be.true
          })
      })
      it('shows that it failed to provision', async function () {
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis', app: null})
          .reply(200, [fixtures.addons['www-redis']])

        const deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'
        const infoByAppStub = stub().resolves(deprovisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        const {error} = await runCommand(Cmd, [
          'www-redis',
        ])
        expect(error?.message).to.equal('The add-on was unable to be created, with status deprovisioned')
      })
    })
  })
  context('waiting for an individual add-on to deprovision', function () {
    context('for an add-on that is still deprovisioning', function () {
      it('waits until the add-on is deprovisioned', async function () {
        // resolveAddon uses this.heroku
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis-2', app: null})
          .reply(200, [fixtures.addons['www-redis-2']])
        // waitForAddonDeprovisioning uses this.heroku for polling
        nock('https://api.heroku.com')
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(200, fixtures.addons['www-redis-2'])
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(404, {id: 'not_found', message: 'Not found.'})

        // SDK mock needed since waitForAddonProvisioning is imported
        const infoByAppStub = stub()
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        const {stderr, stdout} = await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis-2',
        ])
        expectOutput(stderr, `
Destroying www-redis-2... done
`)
        expectOutput(stdout, '')
      })
      it('does NOT notify the user when deprovisioning takes less than 5 seconds', async function () {
        const notifySpy = sandbox.spy(Cmd, 'notifier')

        const deprovisioningAddon = _.clone(fixtures.addons['www-redis-2'])
        deprovisioningAddon.id = '37f27548-db4a-4ae0-bb48-57125df0ddc2'
        deprovisioningAddon.name = 'www-redis-3'
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis-3', app: null})
          .reply(200, [deprovisioningAddon])
          .get('/apps/acme-inc-www/addons/www-redis-3')
          .reply(404, {id: 'not_found', message: 'Not found.'})

        const infoByAppStub = stub()
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis-3',
        ])
        expect(notifySpy.called).to.be.false
        expect(notifySpy.calledOnce).to.be.false
      })
      it('notifies the user when provisioning takes longer than 5 seconds', async function () {
        const notifySpy = sandbox.spy(Cmd, 'notifier')

        const deprovisioningAddon = _.clone(fixtures.addons['www-redis-2'])
        deprovisioningAddon.id = '967dff74-99b4-4fd2-a0f0-79b523d5c0e1'
        deprovisioningAddon.name = 'www-redis-4'
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis-4', app: null})
          .reply(200, [deprovisioningAddon])
          .get('/apps/acme-inc-www/addons/www-redis-4')
          .reply(200, () => {
            clock.tick(5000)
            return deprovisioningAddon
          })
          .get('/apps/acme-inc-www/addons/www-redis-4')
          .reply(404, {id: 'not_found', message: 'Not found.'})

        const infoByAppStub = stub()
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis-4',
        ])
        expect(notifySpy.called).to.be.true
        expect(notifySpy.calledOnce).to.be.true
      })
    })
  })
  context('waiting for add-ons', function () {
    context('for an app', function () {
      it('waits for addons serially', async function () {
        const ignoredAddon = _.clone(fixtures.addons['www-db'])
        ignoredAddon.state = 'provisioned'
        const wwwAddon = _.clone(fixtures.addons['www-db'])
        wwwAddon.state = 'provisioning'
        const redisAddon = _.clone(fixtures.addons['www-redis'])
        redisAddon.state = 'provisioning'
        const redis2Addon = _.clone(fixtures.addons['www-redis-2'])
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        redis2Addon.state = 'deprovisioning'

        // this.heroku.get for listing addons by app
        nock('https://api.heroku.com')
          .get('/apps/acme-inc-www/addons')
          .reply(200, [ignoredAddon, wwwAddon, redisAddon, redis2Addon])

        // waitForAddonDeprovisioning uses this.heroku for polling
        nock('https://api.heroku.com')
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(200, redis2Addon)
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(404, {id: 'not_found', message: 'Not found.'})

        // waitForAddonProvisioning uses SDK
        const provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']
        const provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']

        const callCounts: Record<string, number> = {}
        const infoByAppStub = stub().callsFake((_app: string, name: string) => {
          callCounts[name] = (callCounts[name] || 0) + 1
          if (name === 'www-db') {
            return Promise.resolve(callCounts[name] === 1 ? wwwAddon : provisionedWwwAddon)
          }

          if (name === 'www-redis') {
            return Promise.resolve(callCounts[name] === 1 ? redisAddon : provisionedRedisAddon)
          }

          return Promise.resolve(null)
        })
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        const {stderr, stdout} = await runCommand(Cmd, [
          '--wait-interval',
          '1',
          '--app',
          'acme-inc-www',
        ])
        expectOutput(stderr, `
Creating www-db... done
Creating www-redis... done
Destroying www-redis-2... done
`)
        expectOutput(stdout, `
Created www-db as WWW_URL
Created www-redis as REDIS_URL
`)
      })
    })
    context('for all', function () {
      it('waits for addons serially', async function () {
        const ignoredAddon = _.clone(fixtures.addons['www-db'])
        ignoredAddon.state = 'provisioned'
        const wwwAddon = _.clone(fixtures.addons['www-db'])
        wwwAddon.state = 'provisioning'
        const redisAddon = _.clone(fixtures.addons['www-redis'])
        redisAddon.state = 'provisioning'
        const redis2Addon = _.clone(fixtures.addons['www-redis-2'])
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        redis2Addon.state = 'deprovisioning'

        // this.heroku.get for listing all addons
        nock('https://api.heroku.com')
          .get('/addons')
          .reply(200, [ignoredAddon, wwwAddon, redisAddon, redis2Addon])

        // waitForAddonDeprovisioning uses this.heroku for polling
        nock('https://api.heroku.com')
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(200, redis2Addon)
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(404, {id: 'not_found', message: 'Not found.'})

        // waitForAddonProvisioning uses SDK
        const provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']
        const provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']

        const callCounts: Record<string, number> = {}
        const infoByAppStub = stub().callsFake((_app: string, name: string) => {
          callCounts[name] = (callCounts[name] || 0) + 1
          if (name === 'www-db') {
            return Promise.resolve(callCounts[name] === 1 ? wwwAddon : provisionedWwwAddon)
          }

          if (name === 'www-redis') {
            return Promise.resolve(callCounts[name] === 1 ? redisAddon : provisionedRedisAddon)
          }

          return Promise.resolve(null)
        })
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub},
          withHeaders: stub().returns({addOn: {infoByApp: infoByAppStub}}),
        })

        const {stderr, stdout} = await runCommand(Cmd, [
          '--wait-interval',
          '1',
        ])
        expectOutput(stderr, `
Creating www-db... done
Creating www-redis... done
Destroying www-redis-2... done
`)
        expectOutput(stdout, `
Created www-db as WWW_URL
Created www-redis as REDIS_URL
`)
      })
    })
  })
})
