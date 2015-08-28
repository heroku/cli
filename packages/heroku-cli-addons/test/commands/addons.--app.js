'use strict';

let util     = require('../util');
let cli      = require('heroku-cli-util');
let nock     = require('nock');
let cmd      = require('../../commands/addons');

describe('addons --app', function() {
    beforeEach(function() { cli.mockConsole(); });

    function run(app, cb) {
        return cmd.run({flags: {}, app: app}).then(cb);
    }

    it('prints message when there are no add-ons', function() {
        let appName = `acme-inc-www`;

        nock('https://api.heroku.com')
            .get(`/addon-attachments`)
            .reply(200, []);
        nock('https://api.heroku.com')
            .get(`/apps/${appName}/addons`)
            .reply(200, []);

        return run(appName, function() {
            util.expectOutput(cli.stdout, `No add-ons for app acme-inc-www.`);
        });
    });

});

