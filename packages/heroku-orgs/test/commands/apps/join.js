'use strict';

let cmd = require('../../../commands/apps/join').apps;

describe('heroku apps:join', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  it('joins the app', () => {
    let api = nock('https://api.heroku.com:443')
    .post('/v1/app/myapp/join')
    .reply(200);
    return cmd.run({app: 'myapp'})
    .then(() => expect(``).to.eq(cli.stdout))
      .then(() => expect(`Joining myapp... done\n`).to.eq(cli.stderr))
      .then(() => api.done());
  });
});
