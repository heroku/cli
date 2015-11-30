'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/domains/remove');

describe('domains:remove', function() {
  beforeEach(() => cli.mockConsole());

  it('removes a domain', function() {
    let api = nock('https://api.heroku.com:443')
      .delete('/apps/myapp/domains/foo.com')
      .reply(200, {});
    return cmd.run({app: 'myapp', args: {hostname: 'foo.com'}})
    .then(() => api.done());
  });
});
