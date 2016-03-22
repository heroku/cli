'use strict';

let nock = require('nock');
let cmd  = require('../../../commands/labs/disable');

describe('labs:disable', function() {
  beforeEach(() => cli.mockConsole());

  it('disables a user lab feature', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/account')
      .reply(200, {email: 'jeff@heroku.com'})
      .get('/account/features/feature-a')
      .reply(200, {
        enabled: true,
        name: 'feature-a',
        description: 'a user lab feature',
        doc_url: 'https://devcenter.heroku.com',
      })
      .patch('/account/features/feature-a', {enabled: false})
      .reply(200);
    return cmd.run({args: {feature: 'feature-a'}})
    .then(() => api.done());
  });
});
