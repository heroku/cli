'use strict';

let cmd = require('../../../commands/members');

describe('heroku members', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  it('shows all the org members', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, [
      {email: 'a@heroku.com', role: 'admin'},
      {email: 'b@heroku.com', role: 'collaborator'},
    ]);
    return cmd.run({org: 'myorg', flags: {}})
    .then(() => expect(
`a@heroku.com  admin
b@heroku.com  collaborator
`).to.eq(cli.stdout))
    .then(() => expect(``).to.eq(cli.stderr))
    .then(() => api.done());
  });

  it('shows member when role is viewer', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, [
      {email: 'a@heroku.com', role: 'admin'},
      {email: 'b@heroku.com', role: 'viewer'},
    ]);
    return cmd.run({org: 'myorg', flags: {}})
    .then(() => expect(
`a@heroku.com  admin
b@heroku.com  member
`).to.eq(cli.stdout))
    .then(() => expect(``).to.eq(cli.stderr))
    .then(() => api.done());
  });

  it('filters members by role', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, [
      {email: 'a@heroku.com', role: 'admin'},
      {email: 'b@heroku.com', role: 'viewer'},
    ]);
    return cmd.run({org: 'myorg', flags: {role: 'member'}})
    .then(() => expect(
`b@heroku.com  member
`).to.eq(cli.stdout))
    .then(() => expect(``).to.eq(cli.stderr))
    .then(() => api.done());
  });

  it('shows the right message when filter doesn\'t return results', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, [
      {email: 'a@heroku.com', role: 'admin'},
      {email: 'b@heroku.com', role: 'member'},
    ]);
    return cmd.run({org: 'myorg', flags: {role: 'collaborator'}})
    .then(() => expect(
`No members in myorg with role collaborator
`).to.eq(cli.stdout))
    .then(() => expect(``).to.eq(cli.stderr))
    .then(() => api.done());
  });

  it('filters members by role', () => {
    let api = nock('https://api.heroku.com:443')
    .get('/organizations/myorg/members')
    .reply(200, [
      {email: 'a@heroku.com', role: 'admin'},
      {email: 'b@heroku.com', role: 'viewer'},
    ]);
    return cmd.run({org: 'myorg', flags: {role: 'member'}})
    .then(() => expect(
`b@heroku.com  member
`).to.eq(cli.stdout))
    .then(() => expect(``).to.eq(cli.stderr))
    .then(() => api.done());
  });
});
