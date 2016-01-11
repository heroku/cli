'use strict';

let nock     = require('nock');
let cmd      = require('../../../commands/inboundrules');
let expect   = require('chai').expect;

let now = new Date();

describe('spaces:inboundrules', function() {
  beforeEach(() => cli.mockConsole());

  it('shows the inboundrules', function() {
    let api = nock('https://api.heroku.com:443')
    .get('/spaces/my-space/inbound-ruleset')
    .reply(200,
           {
             version: '1',
             default_action: 'allow',
             created_at: now,
             created_by: 'dickeyxxx',
             rules: [
               {source: '127.0.0.1/20', action: 'allow'},
             ]
           }
          );
    return cmd.run({flags: {space: 'my-space'}})
    .then(() => expect(cli.stdout).to.equal(
`Source        Action
────────────  ──────
127.0.0.1/20  allow
Created at: ${now.toISOString()}
Created by: dickeyxxx
Version:    1
`))
    .then(() => api.done());
  });
});
