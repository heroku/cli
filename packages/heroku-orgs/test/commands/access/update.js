'use strict';

let cmd           = require('../../../commands/access/update');
let error         = require('../../../lib/error');
let assert_exit   = require('../../assert_exit');
let unwrap        = require('../../unwrap');

describe('heroku access:update', () => {
  context('with an org app with privileges', () => {
    beforeEach(() => cli.mockConsole());
    afterEach(()  => nock.cleanAll());

    it('updates the app privileges, view being implicit', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {
        name: 'myapp',
        owner: { email: 'myorg@herokumanager.com' }
      });
      let apiPrivilegesVariant = nock('https://api.heroku.com:443', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
      })
      .patch('/organizations/apps/myapp/collaborators/raulb@heroku.com', {
        privileges: ['deploy', 'view']
      }).reply(200);

      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { privileges: 'deploy' }})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Updating raulb@heroku.com in application myapp with deploy,view privileges... done\n`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiPrivilegesVariant.done());
    });

    it('updates the app privileges, even specifying view as a privilege', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {
        name: 'myapp',
        owner: { email: 'myorg@herokumanager.com' }
      });
      let apiPrivilegesVariant = nock('https://api.heroku.com:443', {
        reqheaders: {Accept: 'application/vnd.heroku+json; version=3.org-privileges'}
      })
      .patch('/organizations/apps/myapp/collaborators/raulb@heroku.com', {
        privileges: ['deploy', 'view']
      }).reply(200);

      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { privileges: 'deploy,view' }})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Updating raulb@heroku.com in application myapp with deploy,view privileges... done\n`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiPrivilegesVariant.done());
    });
  });

  context('with a non org app', () => {
    beforeEach(() => {
      cli.mockConsole();
      error.exit.mock();
    });
    afterEach(()  => nock.cleanAll());

    it('returns an error when passing privileges', () => {
      let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {
        name: 'myapp',
        owner: { email: 'raulb@heroku.com' }
      });

      return assert_exit(1, cmd.run({
        app: 'myapp',
        args: {email: 'raulb@heroku.com'},
        flags: { privileges: 'view,deploy' }
      }).then(() => api.done())).then(function() {
        expect(unwrap(cli.stderr)).to.equal(` ▸    Error: cannot update privileges. The app myapp is not owned by an organization\n`);
      });
    });
  });
});
