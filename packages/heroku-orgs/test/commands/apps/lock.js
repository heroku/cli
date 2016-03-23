'use strict';

let cmd = require('../../../commands/apps/lock').apps;

describe('heroku apps:lock', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  it('locks the app', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations/apps/myapp')
    .reply(200, {name: 'myapp', locked: false})
    .patch('/organizations/apps/myapp', {locked: true})
    .reply(200);
    return cmd.run({app: 'myapp'})
    .then(() => expect(``).to.eq(cli.stdout))
      .then(() => expect(`Locking myapp... done\n`).to.eq(cli.stderr))
      .then(() => api.done());
  });
});
