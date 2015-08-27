'use strict';

let fixtures = require('../fixtures');
let cli    = require('heroku-cli-util');
let nock   = require('nock');
let expect = require('chai').expect;
let cmd    = require('../../commands/addons');

function stripIndents(str) {
    return str.replace(/\A\n|^\s+|\s+$/mg, '');
}

function expectOutput(output) {
    return expect(stripIndents(cli.stdout)).to.equal(stripIndents(output));
}

describe('addons --all', function() {
    let wwwApp = {
        name: "acme-inc-www",
        id: "a84b035c-4c83-11e5-9bda-2cf0ee2c94de"
    };
    let apiApp = {
        name: "acme-inc-api",
        id: "e69612aa-4c88-11e5-887e-2cf0ee2c94de"
    };

    let addons = [{
        app:           wwwApp,
        id:            "8895ea98-4c7b-11e5-9a16-2cf0ee2c94de",
        name:          "www-db",
        addon_service: fixtures.services["heroku-postgresql"],
        plan:          fixtures.plans["heroku-postgresql:hobby-dev"],
    }, {
        app:           wwwApp,
        id:            "8a836ecc-4c88-11e5-ba7e-2cf0ee2c94de",
        name:          "www-redis",
        addon_service: fixtures.services["heroku-redis"],
        plan:          fixtures.plans["heroku-redis:premium-2"],
    }, {
        app:           apiApp,
        id:            "fd1d2d74-4c88-11e5-8b63-2cf0ee2c94de",
        name:          "api-redis",
        addon_service: fixtures.services["heroku-redis"],
        plan:          fixtures.plans["heroku-redis:premium-2"],
    }];

    beforeEach(function() {
        cli.mockConsole();
        nock('https://api.heroku.com')
            .persist()
            .matchHeader('Accept-Expansion', function(val) {
                let vals = val.split(',');
                return vals.indexOf('addon_service') > -1 && vals.indexOf('plan') > -1;
            })
            .get('/addons')
            .reply(200, addons);
    });

    it('prints add-ons in a table', function() {
        return cmd.run({flags: {}}).then(function() {
            expectOutput(
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
});
