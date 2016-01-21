'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/releases/rollback');

describe('releases:rollback', function() {
  beforeEach(() => cli.mockConsole());

  it('rolls back the release', function() {
    process.stdout.columns = 80;
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, { "id": "5efa3510-e8df-4db0-a176-83ff8ad91eb5", "version": 40 })
      .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
      .reply(200, {});
    return cmd.run({app: 'myapp', args: {release: 'v10'}})
    .then(() => api.done());
  });
});
