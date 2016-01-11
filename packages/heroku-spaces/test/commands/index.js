'use strict';

let nock     = require('nock');
let cmd      = require('../../commands');
let expect   = require('chai').expect;

let now = new Date();

describe('spaces', function() {
  beforeEach(() => cli.mockConsole());

  it('shows spaces', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/spaces')
      .reply(200, [
        {name: 'my-space', organization: {name: 'my-org'}, region: {name: 'my-region'}, state: 'enabled', created_at: now},
      ]);
    return cmd.run({flags: {}})
    .then(() => expect(cli.stdout).to.equal(
`Name      Organization  Region     State    Created At
────────  ────────────  ─────────  ───────  ────────────────────────
my-space  my-org        my-region  enabled  ${now.toISOString()}
`))
    .then(() => api.done());
  });
});
