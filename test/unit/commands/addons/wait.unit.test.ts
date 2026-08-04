import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {NotFoundError} from '@heroku/heroku-fetch'
import {expect} from 'chai'
import _ from 'lodash'
import {createSandbox, type SinonFakeTimers, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/wait.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

const notFound = () => new NotFoundError(new Response('', {status: 404}))

describe('addons:wait', function () {
  let sandbox: any
  let clock: SinonFakeTimers
  let sdkMock: MockSDK

  beforeEach(function () {
    sandbox = createSandbox()
    // Fake only Date so the >5s notifier threshold can be advanced
    // synchronously without faking setTimeout (the SDK's polling loop
    // needs real setTimeout to drive the test forward).
    clock = sandbox.useFakeTimers({shouldAdvanceTime: true, toFake: ['Date']})
  })

  afterEach(function () {
    sandbox.restore()
    sdkMock?.restore()
  })
  context('waiting for an individual add-on to provision', function () {
    context('when the add-on is provisioned', function () {
      it('prints output indicating that it is done', async function () {
        // addOn.resolve returns an already-provisioned add-on, so no polling occurs.
        const resolveStub = stub().resolves(fixtures.addons['www-db'])
        const infoByAppStub = stub().resolves(fixtures.addons['www-db'])
        sdkMock = mockSDKPlatform({
          addOn: {infoByApp: infoByAppStub, resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
        })

        const {stderr, stdout} = await runCommand(Cmd, [
          'www-db',
        ])
        expectOutput(stdout, '')
        expectOutput(stderr, '')
        expect(resolveStub.calledOnceWith('www-db', {appIdentity: undefined})).to.be.true
      })
    })
    context('for an add-on that is still provisioning', function () {
      it('waits until the add-on is provisioned, then shows config vars', async function () {
        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']

        const resolveStub = stub().resolves(fixtures.addons['www-redis'])
        // waitForAddonProvisioning polls via platform.withHeaders(...).addOn.infoByApp
        const infoByAppStub = stub()
          .onFirstCall().resolves(fixtures.addons['www-redis'])
          .onSecondCall().resolves(provisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
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

        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']

        const resolveStub = stub().resolves(fixtures.addons['www-redis'])
        const infoByAppStub = stub().resolves(provisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
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

        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']

        const resolveStub = stub().resolves(fixtures.addons['www-redis'])
        const infoByAppStub = stub().callsFake(() => {
          clock.tick(5000)
          return Promise.resolve(provisionedAddon)
        })
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
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

        const resolveStub = stub().resolves(fixtures.addons['www-redis'])
        // waitForAddonProvisioning polls and finds the add-on deprovisioned
        const deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'
        const infoByAppStub = stub().resolves(deprovisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
        })

        const {error} = await runCommand(Cmd, ['--wait-interval', '1', 'www-redis'])
        expect(error?.message).to.equal('The add-on was unable to be created, with status deprovisioned')
        expect(notifySpy.calledWith('heroku addons:wait www-redis', 'Add-on failed to provision', false)).to.be.true
        expect(notifySpy.calledOnce).to.be.true
      })
      it('shows that it failed to provision', async function () {
        const resolveStub = stub().resolves(fixtures.addons['www-redis'])
        const deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'
        const infoByAppStub = stub().resolves(deprovisionedAddon)
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
        })

        const {error} = await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis',
        ])
        expect(error?.message).to.equal('The add-on was unable to be created, with status deprovisioned')
      })
    })
  })
  context('waiting for an individual add-on to deprovision', function () {
    context('for an add-on that is still deprovisioning', function () {
      it('waits until the add-on is deprovisioned', async function () {
        const resolveStub = stub().resolves(_.clone(fixtures.addons['www-redis-2']))
        // pollAddonUntilDeprovisioned polls via platform.withHeaders(...).addOn.infoByApp;
        // the record is deleted (404) once deprovisioned.
        const infoByAppStub = stub()
          .onFirstCall().resolves(_.clone(fixtures.addons['www-redis-2']))
          .onSecondCall().rejects(notFound())
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
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

        const resolveStub = stub().resolves(deprovisioningAddon)
        const infoByAppStub = stub().rejects(notFound())
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
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

        const resolveStub = stub().resolves(deprovisioningAddon)
        const infoByAppStub = stub()
          .onFirstCall().callsFake(() => {
            clock.tick(5000)
            return Promise.resolve(_.clone(deprovisioningAddon))
          })
          .onSecondCall().rejects(notFound())
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
        })

        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis-4',
        ])
        expect(notifySpy.called).to.be.true
        expect(notifySpy.calledOnce).to.be.true
      })
      it('rethrows non-404 errors raised while polling for deprovisioning', async function () {
        // pollAddonUntilDeprovisioned treats a 404 as "deprovisioned"; any
        // other error (e.g. a transient 500) must propagate, not be swallowed.
        const deprovisioningAddon = _.clone(fixtures.addons['www-redis-2'])

        const resolveStub = stub().resolves(deprovisioningAddon)
        const serverError = Object.assign(new Error('Internal Server Error'), {statusCode: 500})
        const infoByAppStub = stub()
          .onFirstCall().resolves(_.clone(deprovisioningAddon))
          .onSecondCall().rejects(serverError)
        sdkMock = mockSDKPlatform({
          addOn: {resolve: resolveStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
        })

        const {error} = await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis-2',
        ])
        expect(error?.message).to.equal('Internal Server Error')
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

        const provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']
        const provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']

        // addOn.listByApp enumerates the app's add-ons
        const listByAppStub = stub().resolves([ignoredAddon, wwwAddon, redisAddon, redis2Addon])

        // The provisioning and deprovisioning helpers both poll via
        // platform.withHeaders(...).addOn.infoByApp. www-redis-2 is deleted
        // (404) once deprovisioned.
        const callCounts: Record<string, number> = {}
        const infoByAppStub = stub().callsFake((_app: string, name: string) => {
          callCounts[name] = (callCounts[name] || 0) + 1
          if (name === 'www-db') {
            return Promise.resolve(callCounts[name] === 1 ? wwwAddon : provisionedWwwAddon)
          }

          if (name === 'www-redis') {
            return Promise.resolve(callCounts[name] === 1 ? redisAddon : provisionedRedisAddon)
          }

          if (name === 'www-redis-2') {
            return callCounts[name] === 1 ? Promise.resolve(redis2Addon) : Promise.reject(notFound())
          }

          return Promise.resolve(null)
        })
        sdkMock = mockSDKPlatform({
          addOn: {listByApp: listByAppStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
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
        expect(listByAppStub.calledOnceWith('acme-inc-www')).to.be.true
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

        const provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']
        const provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']

        // addOn.list enumerates all add-ons
        const listStub = stub().resolves([ignoredAddon, wwwAddon, redisAddon, redis2Addon])

        const callCounts: Record<string, number> = {}
        const infoByAppStub = stub().callsFake((_app: string, name: string) => {
          callCounts[name] = (callCounts[name] || 0) + 1
          if (name === 'www-db') {
            return Promise.resolve(callCounts[name] === 1 ? wwwAddon : provisionedWwwAddon)
          }

          if (name === 'www-redis') {
            return Promise.resolve(callCounts[name] === 1 ? redisAddon : provisionedRedisAddon)
          }

          if (name === 'www-redis-2') {
            return callCounts[name] === 1 ? Promise.resolve(redis2Addon) : Promise.reject(notFound())
          }

          return Promise.resolve(null)
        })
        sdkMock = mockSDKPlatform({
          addOn: {list: listStub},
          withHeaders: stub().returns({addOn: {info: infoByAppStub, infoByApp: infoByAppStub}}),
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
        expect(listStub.calledOnce).to.be.true
      })
    })
  })
})
