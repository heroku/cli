'use strict';

let cmd = require('../../../commands/access');

describe('heroku access', () => {
  context('with non-org app', () => {
    beforeEach(() => cli.mockConsole());
    afterEach(()  => nock.cleanAll());

    it('shows the collaborators', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {
        owner: {email: 'jeff@heroku.com'},
      })
      .get('/apps/myapp/collaborators')
      .reply(200, [
        {user: {email: 'jeff@heroku.com'}, role: 'owner'},
        {user: {email: 'bob@heroku.com'},  role: 'collaborator'},
      ]);
      return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(
`Email            Role
───────────────  ────────────
bob@heroku.com   collaborator
jeff@heroku.com  owner
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => api.done());
    });
  });
});
