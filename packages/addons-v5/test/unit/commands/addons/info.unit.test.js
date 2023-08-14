'use strict'
/* globals context beforeEach */

let fixtures = require('../../../fixtures')
let util = require('../../../util')
let cli = require('heroku-cli-util')
let nock = require('nock')
let cmd = require('../../../../commands/addons/info')
let cache = require('../../../../lib/resolve').addon.cache

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
      return cmd.run({flags: {}, args: {addon: 'www-db'}}).then(function () {
        console.log(`\n \n ${cli.stdout} \n \n`)
        util.expectOutput(cli.stdout,
          `=== www-db
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-www
Plan:         heroku-postgresql:mini
Price:        $5/month
State:        created
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
        util.expectOutput(cli.stdout,
          `=== www-db
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-www
Plan:         heroku-postgresql:mini
Price:        $5/month
State:        created
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
        util.expectOutput(cli.stdout,
          `=== www-db
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-www
Plan:         heroku-postgresql:mini
Price:        $5/month
State:        created
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
        util.expectOutput(cli.stdout,
          `=== dwh-db
Attachments:  acme-inc-dwh::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-dwh
Plan:         heroku-postgresql:standard-2
Price:        $100/month
State:        created
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
        util.expectOutput(cli.stdout,
          `=== dwh-db
Attachments:  acme-inc-dwh::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-dwh
Plan:         heroku-postgresql:standard-2
Price:        contract
State:        created
`)
      })
    })
  })
})
