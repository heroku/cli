/* globals context beforeEach */

'use strict'

const fixtures = require('../../../fixtures')
const util = require('../../../util')
const cli = require('heroku-cli-util')
const nock = require('nock')
const cmd = require('../../../../commands/addons/info')
const cache = require('../../../../lib/resolve').addon.cache
const theredoc = require('theredoc')

describe('addons:info', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
    cache.clear()
  })

  context('with add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .post('/actions/addons/resolve', {app: null, addon: 'www-db'})
        .reply(200, [fixtures.addons['www-db']])

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${fixtures.addons['www-db'].id}`)
        .reply(200, fixtures.addons['www-db'])

      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', function () {
      return cmd.run({flags: {}, args: {addon: 'www-db'}}).then(function () {
        util.expectOutput(cli.stdout, theredoc`
          === www-db
          Attachments:  acme-inc-www::DATABASE
          Installed at: Invalid Date
          Max Price:    $5/month
          Owning app:   acme-inc-www
          Plan:         heroku-postgresql:mini
          Price:        ~$0.007/hour
          State:        created\n
        `)
      })
    })
  })

  context('with app add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .post('/actions/addons/resolve', {app: 'example', addon: 'www-db'})
        .reply(200, [fixtures.addons['www-db']])

      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
      }})
        .get(`/addons/${fixtures.addons['www-db'].id}`)
        .reply(200, fixtures.addons['www-db'])

      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', function () {
      return cmd.run({flags: {}, args: {addon: 'www-db'}, app: 'example'}).then(function () {
        util.expectOutput(cli.stdout, theredoc`
          === www-db
          Attachments:  acme-inc-www::DATABASE
          Installed at: Invalid Date
          Max Price:    $5/month
          Owning app:   acme-inc-www
          Plan:         heroku-postgresql:mini
          Price:        ~$0.007/hour
          State:        created\n
        `)
      })
    })
  })

  context('with app but not an app add-on', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .post('/actions/addons/resolve', {app: 'example', addon: 'www-db'})
        .reply(200, [fixtures.addons['www-db']])

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/apps/example/addons/www-db')
        .reply(404)

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/addons/www-db')
        .reply(200, fixtures.addons['www-db'])

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${fixtures.addons['www-db'].id}`)
        .reply(200, fixtures.addons['www-db'])

      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', function () {
      return cmd.run({flags: {}, args: {addon: 'www-db'}, app: 'example'}).then(function () {
        util.expectOutput(cli.stdout, theredoc`
          === www-db
          Attachments:  acme-inc-www::DATABASE
          Installed at: Invalid Date
          Max Price:    $5/month
          Owning app:   acme-inc-www
          Plan:         heroku-postgresql:mini
          Price:        ~$0.007/hour
          State:        created\n
        `)
      })
    })
  })

  context('with add-ons', function () {
    beforeEach(function () {
      let addon = fixtures.addons['dwh-db']
      addon.billed_price = {cents: 10000}

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .post('/actions/addons/resolve', {app: null, addon: 'dwh-db'})
        .reply(200, [addon])

      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
      }})
        .get(`/addons/${addon.id}`)
        .reply(200, addon)

      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with grandfathered price', function () {
      return cmd.run({flags: {}, args: {addon: 'dwh-db'}}).then(function () {
        util.expectOutput(cli.stdout, theredoc`
          === dwh-db
          Attachments:  acme-inc-dwh::DATABASE
          Installed at: Invalid Date
          Max Price:    $100/month
          Owning app:   acme-inc-dwh
          Plan:         heroku-postgresql:standard-2
          Price:        ~$0.139/hour
          State:        created\n
        `)
      })
    })
  })

  context('with a contract add-on', function () {
    beforeEach(function () {
      let addon = fixtures.addons['dwh-db']
      addon.billed_price = {cents: 0, contract: true}

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .post('/actions/addons/resolve', {app: null, addon: 'dwh-db'})
        .reply(200, [addon])

      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
      }})
        .get(`/addons/${addon.id}`)
        .reply(200, addon)

      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with contract', function () {
      return cmd.run({flags: {}, args: {addon: 'dwh-db'}}).then(function () {
        util.expectOutput(cli.stdout, theredoc`
          === dwh-db
          Attachments:  acme-inc-dwh::DATABASE
          Installed at: Invalid Date
          Max Price:    contract
          Owning app:   acme-inc-dwh
          Plan:         heroku-postgresql:standard-2
          Price:        contract
          State:        created\n
        `)
      })
    })
  })

  context('provisioning add-on', function () {
    beforeEach(function () {
      const provisioningAddon = fixtures.addons['www-redis']

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .post('/actions/addons/resolve', {app: null, addon: 'www-redis'})
        .reply(200, [provisioningAddon])

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${provisioningAddon.id}`)
        .reply(200, provisioningAddon)

      nock('https://api.heroku.com')
        .get(`/addons/${provisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', function () {
      return cmd.run({flags: {}, args: {addon: 'www-redis'}}).then(function () {
        util.expectOutput(cli.stdout, theredoc`
          === www-redis
          Attachments:  acme-inc-www::REDIS
          Installed at: Invalid Date
          Owning app:   acme-inc-www
          Plan:         heroku-redis:premium-2
          Price:        $60/month
          State:        creating\n
        `)
      })
    })
  })

  context('deprovisioning add-on', function () {
    beforeEach(function () {
      const deprovisioningAddon = fixtures.addons['www-redis-2']

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .post('/actions/addons/resolve', {app: null, addon: 'www-redis-2'})
        .reply(200, [deprovisioningAddon])

      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${deprovisioningAddon.id}`)
        .reply(200, deprovisioningAddon)

      nock('https://api.heroku.com')
        .get(`/addons/${deprovisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', function () {
      return cmd.run({flags: {}, args: {addon: 'www-redis-2'}}).then(function () {
        util.expectOutput(cli.stdout, theredoc`
          === www-redis-2
          Attachments:  acme-inc-www::REDIS
          Installed at: Invalid Date
          Owning app:   acme-inc-www
          Plan:         heroku-redis:premium-2
          Price:        $60/month
          State:        destroying\n
        `)
      })
    })
  })
})
