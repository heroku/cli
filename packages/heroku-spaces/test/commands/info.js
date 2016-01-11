'use strict';

let nock     = require('nock');
let cmd      = require('../../commands/info');
let expect   = require('chai').expect;

let now = new Date();

describe('spaces:info', function() {
  beforeEach(() => cli.mockConsole());

  it('shows space info', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200,
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now}
      );
    return cmd.run({flags: {space: 'my-space'}})
    .then(() => expect(cli.stdout).to.equal(
`=== my-space
Organization: my-org
Region:       my-region
State:        enabled
Created at:   ${now.toISOString()}
`))
    .then(() => api.done());
  });
});
