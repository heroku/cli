'use strict'
/* globals describe context it expect beforeEach afterEach */

let fixtures = require('../../fixtures')
let cli = require('heroku-cli-util')
let nock = require('nock')
let cmd = require('../../../commands/addons/wait')
let _ = require('lodash')
const lolex = require('lolex')

let clock
const expansionHeaders = {'Accept-Expansion': 'addon_service,plan'}

describe('addons:wait', () => {
  beforeEach(() => {
    cli.mockConsole()
    cli.exit.mock()
    nock.cleanAll()
    clock = lolex.install()
    clock.setTimeout = (fn, timeout) => { fn() }
  })

  afterEach(() => {
    clock.uninstall()
  })

  context('waiting for an individual add-on', () => {
    context('when the add-on is provisioned', () => {
      beforeEach(() => {
        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/example/addons/www-db')
          .reply(200, fixtures.addons['www-db']) // provisioned
      })

      it('prints output indicating that it is done', () => {
        return cmd.run({flags: {}, args: {addon: 'www-db'}})
          .then(() => expect(cli.stdout, 'to equal', ''))
          .then(() => expect(cli.stderr, 'to equal', 'Done! www-db is provisioned'))
      })
    })
    context('for an add-on that is still provisioning', () => {
      it('waits until the add-on is provisioned, then shows config vars', () => {
        // Call to resolve the add-on:
        let resolverResponse = nock('https://api.heroku.com')
          .get('/addons/www-redis')
          .reply(200, fixtures.addons['www-redis']) // provisioning

        let provisioningResponse = nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, fixtures.addons['www-redis']) // provisioning

        let provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'
        provisionedAddon.config_vars = ['REDIS_URL']

        let provisionedResponse = nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, provisionedAddon)

        return cmd.run({args: {addon: 'www-redis'}, flags: {'interval': '1'}})
          .then(() => resolverResponse.done())
          .then(() => provisioningResponse.done())
          .then(() => provisionedResponse.done())
          .then(() => expect(cli.stderr).to.equal('Creating www-redis... done\n'))
          .then(() => expect(cli.stdout).to.equal('Created www-redis as REDIS_URL\n'))
      })
    })
    context('when add-on transitions to deprovisioned state', () => {
      it('shows that it failed to provision', () => {
        nock('https://api.heroku.com')
          .get('/addons/www-redis')
          .reply(200, fixtures.addons['www-redis']) // provisioning has started

        let deprovisionedAddon = _.clone(fixtures.addons['www-redis'])
        deprovisionedAddon.state = 'deprovisioned'

        nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/acme-inc-www/addons/www-redis')
          .reply(200, deprovisionedAddon)

        let cmdPromise = cmd.run({flags: {}, args: {addon: 'www-redis'}})

        expect(cmdPromise, 'to be rejected with', 'The add-on was unable to be created, with status deprovisioned')
      })
    })
  })
  context('waiting for many add-ons on an app', () => {
    context('when all add-ons are provisioned', () => {
      beforeEach(() => {
        nock('https://api.heroku.com')
          .get('/apps/myapp/addons')
          .reply(200, [fixtures.addons['www-db']]) // provisioned add-on
      })
      it('shows they are created and exits', () => {
        return cmd.run({flags: {}, args: {}, app: 'myapp'})
          .then(() => expect(cli.stderr).to.equal('Waiting for add-ons to be created on myapp... \nwww-db (heroku-postgresql:hobby-dev) created\nWaiting for add-ons to be created on myapp... done\n'))
          .then(() => expect(cli.stdout).to.equal(''))
      })
    })

    context('when one add-on is still provisioning and later completes', () => {
      it('loops until the add-on is provisioned', () => {
        let inProgressResponse = nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/myapp/addons')
          .reply(200, [
            fixtures.addons['www-db'], // already done provisioning
            fixtures.addons['www-redis'] // provisioning
          ])

        let provisionedAddon = _.clone(fixtures.addons['www-redis'])
        provisionedAddon.state = 'provisioned'

        let allDoneResponse = nock('https://api.heroku.com', {reqheaders: expansionHeaders})
          .get('/apps/myapp/addons')
          .reply(200, [
            fixtures.addons['www-db'],
            provisionedAddon
          ])

        return cmd.run({args: {}, app: 'myapp', flags: {'interval': '1'}})
          .then(() => inProgressResponse.done())
          .then(() => allDoneResponse.done())
          .then(() => expect(cli.stderr).to.equal(`Waiting for add-ons to be created on myapp... 
www-db (heroku-postgresql:hobby-dev) created
www-redis (heroku-redis:premium-2) creating
Waiting for add-ons to be created on myapp... 
www-db (heroku-postgresql:hobby-dev) created
www-redis (heroku-redis:premium-2) created
Waiting for add-ons to be created on myapp... done
`))
          .then(() => expect(cli.stdout).to.equal(''))
      })
    })
  })
})
