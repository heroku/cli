'use strict';

let nock     = require('nock');
let cmd      = require('../../../commands/labs/info');
let expect   = require('chai').expect;

describe('labs:info', function() {
  beforeEach(() => cli.mockConsole());

  it('shows labs feature info', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      });
    return cmd.run({args: {feature: 'feature-a'}, flags: {}})
    .then(() => expect(cli.stdout).to.equal(`=== feature-a
Description: a user lab feature
Docs:        https://devcenter.heroku.com
Enabled:     true
`))
    .then(() => api.done());
  });
});
