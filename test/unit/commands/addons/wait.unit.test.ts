import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import _ from 'lodash'
import lolex from 'lolex'
import nock from 'nock'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/addons/wait.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'
let clock: any
const expansionHeaders = {'Accept-Expansion': 'addon_service,plan'}

describe('addons:wait', function () {
  let sandbox: any

  beforeEach(function () {
    sandbox = sinon.createSandbox()
    nock.cleanAll()
    clock = lolex.install()
    clock.setTimeout = function (fn: any) {
      process.nextTick(fn)
    }
  })

  afterEach(function () {
    clock.uninstall()
    sandbox.restore()
  })
  context('waiting for an individual add-on to provision', function () {
    context('when the add-on is provisioned', function () {
      beforeEach(function () {
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .post('/actions/addons/resolve', {addon: 'www-db', app: null})
          .reply(200, [fixtures.addons['www-db']])
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
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis', app: null})
          .reply(200, [fixtures.addons['www-redis']])
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, fixtures.addons['www-redis'])
        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, provisionedAddon)
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
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, () => provisionedAddon)
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
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, () => {
            clock.tick(5000)
            return provisionedAddon
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
        nock('https://api.heroku.com')
          .get('/addons/www-redis')
          .reply(200, fixtures.addons['www-redis'])
        const deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, deprovisionedAddon)
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
          .get('/addons/www-redis')
          .reply(200, fixtures.addons['www-redis'])
        const deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, deprovisionedAddon)
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
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {addon: 'www-redis-2', app: null})
          .reply(200, [fixtures.addons['www-redis-2']])
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(200, fixtures.addons['www-redis-2'])
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(404, {id: 'not_found', message: 'Not found.'})
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
        nock('https://api.heroku.com')
          .get('/apps/acme-inc-www/addons')
          .reply(200, [ignoredAddon, wwwAddon, redisAddon, redis2Addon])
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, wwwAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, redisAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(200, redis2Addon)
        const provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']
        const provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, provisionedRedisAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, provisionedWwwAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(404, {id: 'not_found', message: 'Not found.'})
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
        nock('https://api.heroku.com')
          .get('/addons')
          .reply(200, [ignoredAddon, wwwAddon, redisAddon, redis2Addon])
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, wwwAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, redisAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(200, redis2Addon)
        const provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']
        const provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, provisionedRedisAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, provisionedWwwAddon)
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(404, {id: 'not_found', message: 'Not found.'})
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
