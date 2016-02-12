'use strict';

let cmd = require('../../../commands/orgs');

describe('heroku orgs', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  it('shows the orgs', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations')
    .reply(200, [
      {name: 'org a', role: 'collaborator'},
      {name: 'org b', role: 'admin'},
    ]);
    return cmd.run({flags: {}})
    .then(() => expect(
`org a         collaborator
org b         admin
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => api.done());
  });

  it('shows member when role is viewer', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations')
    .reply(200, [
      {name: 'org a', role: 'viewer'}
    ]);
    return cmd.run({flags: {}})
    .then(() => expect(
`org a         member
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => api.done());
  });
});
