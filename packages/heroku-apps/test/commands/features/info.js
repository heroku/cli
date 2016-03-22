'use strict';

let cmd = commands.find(c => c.topic === 'features' && c.command === 'info');

describe('features:info', function() {
  beforeEach(() => cli.mockConsole());

  it('shows feature info', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/features/feature-a')
      .reply(200, {name: 'myfeature', description: 'the description', doc_url: 'https://devcenter.heroku.com', enabled: true});
    return cmd.run({app: 'myapp', flags: {}, args: {feature: 'feature-a'}})
    .then(() => expect(cli.stdout).to.eq(`=== myfeature
Description: the description
Docs:        https://devcenter.heroku.com
Enabled:     true
`))
    .then(() => api.done());
  });
});
