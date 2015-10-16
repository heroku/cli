'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/maintenance/off');

describe('maintenance:off', function() {
  beforeEach(() => cli.mockConsole());

  it('turns maintenance mode off', function() {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp', {maintenance: false})
      .reply(200);
    return cmd.run({app: 'myapp'})
    .then(() => api.done());
  });
});
