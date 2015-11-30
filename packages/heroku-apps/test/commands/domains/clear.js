'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/domains/clear');

describe('domains:clear', function() {
  beforeEach(() => cli.mockConsole());

  it('removes all domains', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/domains')
      .reply(200, [
        {kind: 'custom', hostname: 'foo.com'},
        {kind: 'custom', hostname: 'foo2.com'},
      ])
      .delete('/apps/myapp/domains/foo.com').reply(200)
      .delete('/apps/myapp/domains/foo2.com').reply(200);
    return cmd.run({app: 'myapp'})
    .then(() => api.done());
  });
});
