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
`bob@heroku.com   collaborator
jeff@heroku.com  owner
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => api.done());
    });
  });

  context('with an org app with privileges', () => {
    beforeEach(() => cli.mockConsole());
    afterEach(()  => nock.cleanAll());

    it('hides the org collaborator record', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {
        owner: {email: 'myorg@herokumanager.com'},
      })
      .get('/organizations/myorg/members')
      .reply(200, [
          {
            email: 'raulb@heroku.com', role: 'admin',
            user: { email: 'raulb@heroku.com' }
          },
          {
            email: 'bob@heroku.com', role: 'viewer',
            user: { email: 'bob@heroku.com' }
          },
          {
            email: 'peter@heroku.com', role: 'collaborator',
            user: { email: 'peter@heroku.com' }
          }
      ]);

      let apiPrivilegesVariant = nock('https://api.heroku.com:443', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
      })
      .get('/organizations/privileges')
      .reply(200, [
        { name: 'deploy' },
        { name: 'manage' },
        { name: 'operate' },
        { name: 'view' }
      ])
      .get('/organizations/apps/myapp/collaborators')
      .reply(200, [
        { privileges: [],
          role: 'owner',
          user: { email: 'myorg@herokumanager.com' }
        },
        {
          privileges: [ { name: 'deploy' }, { name: 'view' } ],
          role: 'viewer',
          user: { email: 'bob@heroku.com' }
        }
      ]);

      let apiV2 = nock('https://api.heroku.com:443', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=2'}
      })
      .get('/v1/organization/myorg')
      .reply(200, {
        flags: [
          'org-access-controls'
        ],
      });
      return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(
  `bob@heroku.com    member  deploy,view
raulb@heroku.com  admin   deploy,manage,operate,view
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => api.done())
      .then(() => apiV2.done())
      .then(() => apiPrivilegesVariant.done());
    });
  });
});
