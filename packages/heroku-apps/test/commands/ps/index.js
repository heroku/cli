'use strict';

let nock     = require('nock');
let cmd      = require('../../../commands/ps');
let expect   = require('chai').expect;
let strftime = require('strftime');

let hourAgo = new Date(new Date() - 60 * 60 * 1000);
let hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo);

describe('ps', function() {
  beforeEach(() => cli.mockConsole());

  it('shows dyno list', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
      ]);
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stdout).to.equal(`=== web (Free): npm start
web.1: up ${hourAgoStr} (~ 1h ago)

`))
    .then(() => api.done());
  });
});
