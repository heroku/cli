'use strict';

let cmd = require('../../../commands/members/add').add;

describe('heroku members:add', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  it('adds a member to an org', () => {
    let api = nock('https://api.heroku.com:443')
    .put('/organizations/myorg/members', {email: 'foo@foo.com', role: 'admin'})
    .reply(200);
    return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
    .then(() => expect(``).to.eq(cli.stdout))
    .then(() => expect(`Adding foo@foo.com to myorg as admin... done\n`).to.eq(cli.stderr))
    .then(() => api.done());
  });
});
