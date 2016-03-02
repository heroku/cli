'use strict';

let nock     = require('nock');
let cmd      = require('../../../commands/ps');
let expect   = require('chai').expect;
let strftime = require('strftime');

let hourAgo = new Date(new Date() - 60 * 60 * 1000);
let hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo);
let hourAhead = new Date(new Date().getTime() + 60 * 60 * 1000);

describe('ps', function() {
  beforeEach(() => cli.mockConsole());

  it('shows dyno list', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Free', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
      ]);
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stdout).to.equal(`=== web (Free): npm start (1)
web.1: up ${hourAgoStr} (~ 1h ago)

`))
    .then(() => api.done());
  });

  it('shows free time remaining', function() {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/actions/get-quota')
      .reply(200, {allow_until: hourAhead})
      .get('/apps/myapp/dynos')
      .reply(200);

    let freeExpression = /^Free quota left: ([\d]+h [\d]{1,2}m|[\d]{1,2}m [\d]{1,2}s|[\d]{1,2}s])\n$/;
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stdout).to.match(freeExpression))
    .then(() => api.done());
  });
});
