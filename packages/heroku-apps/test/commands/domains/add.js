'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/domains/add');

describe('domains:add', function() {
  beforeEach(() => cli.mockConsole());

  it('adds a domain', function() {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/domains', {hostname: 'foo.com'})
      .reply(200, {});
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}})
    .then(() => api.done());
  });
});
