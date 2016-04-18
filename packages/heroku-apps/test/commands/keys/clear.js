'use strict';

let cmd = commands.find(c => c.topic === 'keys' && c.command === 'clear');

describe('keys:clear', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(() => nock.cleanAll());

  it('removes all ssh keys', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [{id: 1}, {id: 2}])
      .delete('/account/keys/1').reply(200)
      .delete('/account/keys/2').reply(200);
    return cmd.run({args: {key: 'user@machine'}})
    .then(() => expect('').to.equal(cli.stdout))
    .then(() => expect('Removing all ssh keys... done\n').to.equal(cli.stderr))
    .then(() => api.done());
  });
});
