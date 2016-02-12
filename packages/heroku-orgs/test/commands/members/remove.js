'use strict';

let cmd = require('../../../commands/members/remove');

describe('heroku members:remove', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  it('removes a member from an org', () => {
    let api = nock('https://api.heroku.com:443')
    .delete('/organizations/myorg/members/foo%40foo.com')
    .reply(200);
    return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}})
    .then(() => expect(``).to.eq(cli.stdout))
    .then(() => expect(`Removing foo@foo.com from myorg... done\n`).to.eq(cli.stderr))
    .then(() => api.done());
  });
});
