'use strict';

let nock     = require('nock');
let cmd      = require('../../commands/destroy');

describe('spaces:destroy', function() {
  beforeEach(() => cli.mockConsole());

  it('destroys a space', function() {
    let api = nock('https://api.heroku.com:443')
      .delete('/spaces/my-space')
      .reply(200);
    return cmd.run({flags: {space: 'my-space', confirm: 'my-space'}})
    .then(() => api.done());
  });
});
