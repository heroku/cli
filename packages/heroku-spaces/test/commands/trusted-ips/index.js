'use strict';

let nock     = require('nock');
let cmd      = require('../../../commands/trusted-ips');
let expect   = require('chai').expect;

let now = new Date();

describe('trusted-ips', function() {
  beforeEach(() => cli.mockConsole());

  it('shows the trusted IP ranges', function() {
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
`=== Trusted IP Ranges
127.0.0.1/20
`))
    .then(() => api.done());
  });
});
