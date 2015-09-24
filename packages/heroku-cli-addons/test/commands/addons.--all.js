'use strict';

let fixtures = require('../fixtures');
let util     = require('../util');
let cli      = require('heroku-cli-util');
let nock     = require('nock');
let expect   = require('chai').expect;
let cmd      = require('../../commands/addons');

describe('addons --all', function() {
    beforeEach(function() { cli.mockConsole(); });

    let addons = [
        fixtures.addons["www-db"],
        fixtures.addons["www-redis"],
        fixtures.addons["api-redis"]
    ];

    context('with add-ons', function() {
        beforeEach(function() {
            nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
                .matchHeader('Accept-Expansion', function(val) {
                    let vals = val.split(',');
                    return vals.indexOf('addon_service') > -1 && vals.indexOf('plan') > -1;
                })
                .get('/addons')
                .reply(200, addons);
        });

        it('prints add-ons in a table', function() {
            return cmd.run({flags: {}}).then(function() {
                util.expectOutput(cli.stdout,
                    `Owning App    Add-on     Plan                         Price
                    ────────────  ─────────  ───────────────────────────  ─────────
                    acme-inc-api  api-redis  heroku-redis:premium-2       $60/month
                    acme-inc-www  www-db     heroku-postgresql:hobby-dev  free
                    acme-inc-www  www-redis  heroku-redis:premium-2       $60/month`);
            });
        });

        it('orders by app, then by add-on name', function() {
            return cmd.run({flags: {}}).then(function() {
                expect(cli.stdout.indexOf('acme-inc-api')).to.be.lt(cli.stdout.indexOf('acme-inc-www'));
                expect(cli.stdout.indexOf('www-db')).to.be.lt(cli.stdout.indexOf('www-redis'));
            });
        });

      context('--json', function () {
          it('prints the output in json format', function () {
              return cmd.run({flags: {json: true}})
              .then(function() {
                  expect(JSON.parse(cli.stdout)[0].name).to.eq('www-db');
              });
          });
       });
    });

    it('prints message when there are no add-ons', function() {
        nock('https://api.heroku.com').get('/addons').reply(200, []);
        return cmd.run({flags: {}}).then(function() {
            util.expectOutput(cli.stdout, `No add-ons.`);
        });
    });
});
