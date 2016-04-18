'use strict';

let cmd = commands.find(c => c.topic === 'keys' && !c.command);

let expect = require('unexpected');

describe('heroku keys', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(() => nock.cleanAll());

  it('warns if no keys', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys').reply(200, []);
    return cmd.run({flags: {}})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', ' ▸    You have no ssh keys.\n'))
    .then(() => api.done());
  });

  it('shows ssh keys', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine'}
      ]);
    return cmd.run({flags: {}})
    .then(() => expect(cli.stdout, 'to equal', `=== user@example.com keys
ssh-rsa AAAAB3NzxC...V7iHuYrZxd user@machine\n`))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });

  it('shows ssh keys as json', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine'}
      ]);
    return cmd.run({flags: {json: true}})
    .then(() => expect(JSON.parse(cli.stdout)[0], 'to satisfy', {email: 'user@example.com'}))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });

  it('shows full ssh keys', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/account/keys')
      .reply(200, [
        {email: 'user@example.com', public_key: 'ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine'}
      ]);
    return cmd.run({flags: {long: true}})
    .then(() => expect(cli.stdout, 'to equal', `=== user@example.com keys
ssh-rsa AAAAB3NzxCXXXXXXXXXXXXXXXXXXXV7iHuYrZxd user@machine\n`))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });
});
