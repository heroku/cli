import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/addons/wait'
import runCommand from '../../../helpers/runCommand'
import * as fixtures from '../../../fixtures/addons/fixtures'
import * as nock from 'nock'
import * as _ from 'lodash'
import expectOutput from '../../../helpers/utils/expectOutput'
import {expect} from 'chai'
import * as sinon from 'sinon'

const lolex = require('lolex')

let clock: any
const expansionHeaders = {'Accept-Expansion': 'addon_service,plan'}

describe('addons:wait', () => {
  let sandbox: any
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    nock.cleanAll()
    clock = lolex.install()
    clock.setTimeout = function (fn: any) {
      process.nextTick(fn)
    }
  })
  afterEach(() => {
    clock.uninstall()
    sandbox.restore()
  })
  context('waiting for an individual add-on to provision', () => {
    context('when the add-on is provisioned', () => {
      beforeEach(() => {
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .post('/actions/addons/resolve', {app: null, addon: 'www-db'})
          .reply(200, [fixtures.addons['www-db']])
      })
      it('prints output indicating that it is done', async () => {
        await runCommand(Cmd, [
          'www-db',
        ])
        expectOutput(stdout.output, '')
        expectOutput(stderr.output, '')
      })
    })
    context('for an add-on that is still provisioning', () => {
      it('waits until the add-on is provisioned, then shows config vars', async () => {
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis'})
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
        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis',
        ])
        expectOutput(stderr.output, `
Creating www-redis...
Creating www-redis... done
`)
        expectOutput(stdout.output, `
Created www-redis as REDIS_URL
`)
      })
      it('does NOT notify the user when provisioning takes less than 5 seconds', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis'})
          .reply(200, [fixtures.addons['www-redis']])
        const provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, () => {
            return provisionedAddon
          })
        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis',
        ])
        expect(notifySpy.called).to.be.false
        expect(notifySpy.calledOnce).to.be.false
      })
      it('notifies the user when provisioning takes longer than 5 seconds', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis'})
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
    context('when add-on transitions to deprovisioned state', () => {
      it('shows notification', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis'})
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
      it('shows that it failed to provision', function () {
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis'})
          .reply(200, [fixtures.addons['www-redis']])
          .get('/addons/www-redis')
          .reply(200, fixtures.addons['www-redis'])
        const deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, deprovisionedAddon)
        return runCommand(Cmd, [
          'www-redis',
        ])
          .then(() => {
            throw new Error('unreachable')
          })
          .catch(error => expect(error.message).to.equal('The add-on was unable to be created, with status deprovisioned'))
      })
    })
  })
  context('waiting for an individual add-on to deprovision', () => {
    context('for an add-on that is still deprovisioning', () => {
      it('waits until the add-on is deprovisioned', async () => {
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis-2'})
          .reply(200, [fixtures.addons['www-redis-2']])
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(200, fixtures.addons['www-redis-2'])
          .get('/apps/acme-inc-www/addons/www-redis-2')
          .reply(404, {id: 'not_found', message: 'Not found.'})
        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          'www-redis-2',
        ])
        expectOutput(stderr.output, `
Destroying www-redis-2...
Destroying www-redis-2... done
`)
        expectOutput(stdout.output, '')
      })
      it('does NOT notify the user when deprovisioning takes less than 5 seconds', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        const deprovisioningAddon = _.clone(fixtures.addons['www-redis-2'])
        deprovisioningAddon.id = '37f27548-db4a-4ae0-bb48-57125df0ddc2'
        deprovisioningAddon.name = 'www-redis-3'
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis-3'})
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
      it('notifies the user when provisioning takes longer than 5 seconds', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')
        const deprovisioningAddon = _.clone(fixtures.addons['www-redis-2'])
        deprovisioningAddon.id = '967dff74-99b4-4fd2-a0f0-79b523d5c0e1'
        deprovisioningAddon.name = 'www-redis-4'
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', {app: null, addon: 'www-redis-4'})
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
  context('waiting for add-ons', () => {
    context('for an app', () => {
      it('waits for addons serially', async () => {
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
        await runCommand(Cmd, [
          '--wait-interval',
          '1',
          '--app',
          'acme-inc-www',
        ])
        expectOutput(stderr.output, `
Creating www-db...
Creating www-db... done
Creating www-redis...
Creating www-redis... done
Destroying www-redis-2...
Destroying www-redis-2... done
`)
        expectOutput(stdout.output, `
Created www-db as WWW_URL
Created www-redis as REDIS_URL
`)
      })
    })
    context('for all', () => {
      it('waits for addons serially', async () => {
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
        await runCommand(Cmd, [
          '--wait-interval',
          '1',
        ])
        expectOutput(stderr.output, `
Creating www-db...
Creating www-db... done
Creating www-redis...
Creating www-redis... done
Destroying www-redis-2...
Destroying www-redis-2... done
`)
        expectOutput(stdout.output, `
Created www-db as WWW_URL
Created www-redis as REDIS_URL
`)
      })
    })
  })
})
