'use strict'
/* globals describe context it beforeEach */

let fixtures = require('../fixtures')
let util = require('../util')
let cli = require('heroku-cli-util')
let nock = require('nock')
let expect = require('chai').expect
let cmd = require('../../commands/addons')

describe('addons --all', function () {
  beforeEach(() => cli.mockConsole())

  let addons = [
    fixtures.addons['www-db'],
    fixtures.addons['www-redis'],
    fixtures.addons['api-redis']
  ]

  context('with add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/addons')
        .reply(200, addons)
    })

    it('prints add-ons in a table', function () {
      return cmd.run({flags: {}}).then(function () {
        util.expectOutput(cli.stdout,
`Owning App    Add-on     Plan                         Price      State
────────────  ─────────  ───────────────────────────  ─────────  ────────
acme-inc-api  api-redis  heroku-redis:premium-2       $60/month  created
acme-inc-www  www-db     heroku-postgresql:hobby-dev  free       created
acme-inc-www  www-redis  heroku-redis:premium-2       $60/month  creating`)
      })
    })

    it('orders by app, then by add-on name', function () {
      return cmd.run({flags: {}}).then(function () {
        expect(cli.stdout.indexOf('acme-inc-api')).to.be.lt(cli.stdout.indexOf('acme-inc-www'))
        expect(cli.stdout.indexOf('www-db')).to.be.lt(cli.stdout.indexOf('www-redis'))
      })
    })

    context('--json', function () {
      it('prints the output in json format', function () {
        return cmd.run({flags: {json: true}})
          .then(function () {
            expect(JSON.parse(cli.stdout)[0].name).to.eq('www-db')
          })
      })
    })
  })

  context('with a grandfathered add-on', function () {
    beforeEach(function () {
      let addon = fixtures.addons['dwh-db']
      addon.billed_price_cents = 10000

      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        'Accept': 'application/vnd.heroku+json; version=3.with-addon-billing-info'
      }})
        .get('/addons')
        .reply(200, [addon])
    })

    it('prints add-ons in a table with the grandfathered price', function () {
      return cmd.run({flags: {}}).then(function () {
        util.expectOutput(cli.stdout,
`Owning App    Add-on  Plan                          Price       State
────────────  ──────  ────────────────────────────  ──────────  ───────
acme-inc-dwh  dwh-db  heroku-postgresql:standard-2  $100/month  created`)
      })
    })
  })

  it('prints message when there are no add-ons', function () {
    nock('https://api.heroku.com').get('/addons').reply(200, [])
    return cmd.run({flags: {}}).then(function () {
      util.expectOutput(cli.stdout, 'No add-ons.')
    })
  })
})
