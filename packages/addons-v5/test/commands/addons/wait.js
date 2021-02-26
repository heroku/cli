'use strict'
/* globals describe context it beforeEach afterEach */

let fixtures = require('../../fixtures')
let cli = require('heroku-cli-util')
let nock = require('nock')
let cmd = require('../../../commands/addons/wait')
let _ = require('lodash')
const lolex = require('lolex')
const sinon = require('sinon')
const { expect } = require('chai')

let clock
const expansionHeaders = { 'Accept-Expansion': 'addon_service,plan' }

describe('addons:wait', () => {
  let sandbox
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    cli.mockConsole()
    cli.exit.mock()
    nock.cleanAll()
    clock = lolex.install()
    clock.setTimeout = function (fn, timeout) { process.nextTick(fn) }
  })

  afterEach(() => {
    clock.uninstall()
    sandbox.restore()
  })

  context('waiting for an individual add-on', () => {
    context('when the add-on is provisioned', () => {
      beforeEach(() => {
        this.nockExpectation = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .post('/actions/addons/resolve', { 'app': null, 'addon': 'www-db' })
          .reply(200, [fixtures.addons['www-db']]) // provisioned
      })

      it('prints output indicating that it is done', async () => {
        await cmd.run({ flags: {}, args: { addon: 'www-db' } })

        expect(cli.stdout).to.equal('');

        return expect(cli.stderr).to.equal('')
      })
    })

    context('for an add-on that is still provisioning', () => {
      it('waits until the add-on is provisioned, then shows config vars', async () => {
        // Call to resolve the add-on:
        let resolverResponse = nock('https://api.heroku.com')
          .post('/actions/addons/resolve', { 'app': null, 'addon': 'www-redis' })
          .reply(200, [fixtures.addons['www-redis']]) // provisioning

        let provisioningResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, fixtures.addons['www-redis']) // provisioning

        let provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']

        let provisionedResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, provisionedAddon)

        await cmd.run({ args: { addon: 'www-redis' }, flags: { 'wait-interval': '1' } })

        resolverResponse.done();
        provisioningResponse.done();
        provisionedResponse.done();
        expect(cli.stderr).to.equal('Creating www-redis... done\n');

        return expect(cli.stdout).to.equal('Created www-redis as REDIS_URL\n')
      })

      it('does NOT notify the user when provisioning takes less than 5 seconds', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

        // Call to resolve the add-on:
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', { 'app': null, 'addon': 'www-redis' })
          .reply(200, [fixtures.addons['www-redis']]) // provisioning

        let provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']

        nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, () => {
            return provisionedAddon
          })

        await cmd.run({ args: { addon: 'www-redis' }, flags: { 'wait-interval': '1' } })

        expect(notifySpy.called).to.be.false;

        return expect(notifySpy.calledOnce).to.be.false
      })

      it('notifies the user when provisioning takes longer than 5 seconds', async () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

        // Call to resolve the add-on:
        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', { 'app': null, 'addon': 'www-redis' })
          .reply(200, [fixtures.addons['www-redis']]) // provisioning

        let provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']

        nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, () => {
            clock.tick(5000)
            return provisionedAddon
          })

        await cmd.run({ args: { addon: 'www-redis' }, flags: { 'wait-interval': '1' } })

        expect(notifySpy.called).to.be.true;

        return expect(notifySpy.calledOnce).to.be.true
      })
    })

    context('when add-on transitions to deprovisioned state', () => {
      it('shows notification', () => {
        const notifySpy = sandbox.spy(require('@heroku-cli/notifications'), 'notify')

        nock('https://api.heroku.com')
          .post('/actions/addons/resolve', { 'app': null, 'addon': 'www-redis' })
          .reply(200, [fixtures.addons['www-redis']]) // provisioning

        nock('https://api.heroku.com')
          .get('/addons/www-redis')
          .reply(200, fixtures.addons['www-redis']) // provisioning

        let deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'

        nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, deprovisionedAddon)

        /* eslint-disable no-unused-expressions */
        return cmd.run({ flags: {}, args: { addon: 'www-redis' } })
          .catch((err) => {
            expect(err.message).to.equal('The add-on was unable to be created, with status deprovisioned')
            expect(notifySpy.called).to.be.true
            expect(notifySpy.calledOnce).to.be.true
          })
      })

      it('shows that it failed to provision', async function() {
        nock('https://api.heroku.com')
          .get('/addons/www-redis')
          .reply(200, fixtures.addons['www-redis']) // provisioning has started

        let deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'

        nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, deprovisionedAddon)

        try {
          await cmd.run({ flags: {}, args: { addon: 'www-redis' } })
          throw new Error('unreachable')
        } catch (err) {
          return expect(err.message).to.equal('The add-on was unable to be created, with status deprovisioned')
        }
      })
    })
  })

  context('waiting for add-ons', () => {
    context('for an app', () => {
      it('waits for addons serially', async () => {
        let ignoredAddon = _.clone(fixtures.addons['www-db'])
        ignoredAddon.state = 'provisioned'

        let wwwAddon = _.clone(fixtures.addons['www-db'])
        wwwAddon.state = 'provisioning'

        let redisAddon = _.clone(fixtures.addons['www-redis'])
        redisAddon.state = 'provisioning'

        let resolverResponse = nock('https://api.heroku.com')
          .get('/apps/acme-inc-www/addons')
          .reply(200, [ignoredAddon, wwwAddon, redisAddon])

        let wwwResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, wwwAddon)

        let redisResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, redisAddon)

        let provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']

        let provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']

        let provisionedRedisResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, provisionedRedisAddon)

        let provisionedWwwResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, provisionedWwwAddon)

        await cmd.run({ args: { addon: null }, flags: { 'wait-interval': '1' }, app: 'acme-inc-www' })

        resolverResponse.done();
        redisResponse.done();
        wwwResponse.done();
        provisionedRedisResponse.done();
        provisionedWwwResponse.done();
        expect(cli.stderr).to.equal('Creating www-db... done\nCreating www-redis... done\n');

        return expect(cli.stdout).to.equal('Created www-db as WWW_URL\nCreated www-redis as REDIS_URL\n')
      })
    })

    context('for all', () => {
      it('waits for addons serially', async () => {
        let ignoredAddon = _.clone(fixtures.addons['www-db'])
        ignoredAddon.state = 'provisioned'

        let wwwAddon = _.clone(fixtures.addons['www-db'])
        wwwAddon.state = 'provisioning'

        let redisAddon = _.clone(fixtures.addons['www-redis'])
        redisAddon.state = 'provisioning'

        let resolverResponse = nock('https://api.heroku.com')
          .get('/addons')
          .reply(200, [ignoredAddon, wwwAddon, redisAddon])

        let wwwResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, wwwAddon)

        let redisResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, redisAddon)

        let provisionedWwwAddon = _.clone(fixtures.addons['www-db'])
        provisionedWwwAddon.state = 'provisioned'
        provisionedWwwAddon.config_vars = ['WWW_URL']

        let provisionedRedisAddon = _.clone(fixtures.addons['www-redis'])
        provisionedRedisAddon.state = 'provisioned'
        provisionedRedisAddon.config_vars = ['REDIS_URL']

        let provisionedRedisResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, provisionedRedisAddon)

        let provisionedWwwResponse = nock('https://api.heroku.com', { reqheaders: expansionHeaders })
          .get('/apps/acme-inc-www/addons/www-db')
          .reply(200, provisionedWwwAddon)

        await cmd.run({ args: { addon: null }, flags: { 'wait-interval': '1' }, app: null })

        resolverResponse.done();
        redisResponse.done();
        wwwResponse.done();
        provisionedRedisResponse.done();
        provisionedWwwResponse.done();
        expect(cli.stderr).to.equal('Creating www-db... done\nCreating www-redis... done\n');

        return expect(cli.stdout).to.equal('Created www-db as WWW_URL\nCreated www-redis as REDIS_URL\n')
      })
    })
  })
})
