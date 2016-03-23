'use strict';

let cmd = require('../../../commands/apps/leave').apps;

describe('heroku apps:leave', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  context('when it is an org app', () => {
    it('leaves the app', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {owner: {email: 'foo@herokumanager.com'}})
      .delete('/v1/app/myapp/join')
      .reply(204);
      return cmd.run({app: 'myapp'})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Leaving myapp... done\n`).to.eq(cli.stderr))
        .then(() => api.done());
    });
  });

  context('when it is not an org app', () => {
    it('leaves the app', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {owner: {email: 'foo@foo.com'}})
      .get('/account')
      .reply(200, {email: 'foo@foo.com'})
      .delete('/apps/myapp/collaborators/foo%40foo.com')
      .reply(200);
      return cmd.run({app: 'myapp'})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Leaving myapp... done\n`).to.eq(cli.stderr))
        .then(() => api.done());
    });
  });
});
