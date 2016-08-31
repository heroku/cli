'use strict'
/* globals describe context it beforeEach */

let fixtures = require('../../fixtures')
let util = require('../../util')
let cli = require('heroku-cli-util')
let nock = require('nock')
let cmd = require('../../../commands/addons/info')

describe('addons:info', function () {
  beforeEach(function () {
    cli.mockConsole()
    nock.cleanAll()
  })

  context('with add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/addons/www-db')
        .reply(200, fixtures.addons['www-db'])
      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['www-db']['id']}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', function () {
      return cmd.run({flags: {}, args: {addon: 'www-db'}}).then(function () {
        util.expectOutput(cli.stdout,
`=== www-db
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-www
Plan:         heroku-postgresql:hobby-dev
Price:        free
State:        provisioned
`)
      })
    })
  })

  context('with app add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/apps/example/addons/www-db')
        .reply(200, fixtures.addons['www-db'])
      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['www-db']['id']}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', function () {
      return cmd.run({flags: {}, args: {addon: 'www-db'}, app: 'example'}).then(function () {
        util.expectOutput(cli.stdout,
`=== www-db
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-www
Plan:         heroku-postgresql:hobby-dev
Price:        free
State:        provisioned
`)
      })
    })
  })

  context('with app but not an app add-on', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/apps/example/addons/www-db')
        .reply(404)
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/addons/www-db')
        .reply(200, fixtures.addons['www-db'])
      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['www-db']['id']}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', function () {
      return cmd.run({flags: {}, args: {addon: 'www-db'}, app: 'example'}).then(function () {
        util.expectOutput(cli.stdout,
`=== www-db
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Owning app:   acme-inc-www
Plan:         heroku-postgresql:hobby-dev
Price:        free
State:        provisioned
`)
      })
    })
  })
})
