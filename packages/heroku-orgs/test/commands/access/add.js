'use strict';

let cmd           = require('../../../commands/access/add');
let error         = require('../../../lib/error');
let assert_exit   = require('../../assert_exit');
let unwrap        = require('../../unwrap');
let stub          = require('../../stub');
let api;
let apiPrivilegesVariant;
let apiV2;

describe('heroku access:add', () => {
  context('with an org app with user privileges', () => {
    beforeEach(() => {
      cli.mockConsole();
      api = stub.getOrgApp();
      apiPrivilegesVariant = stub.postCollaboratorsWithPrivileges(['view', 'deploy']);
      apiV2 = stub.orgFlags(['org-access-controls']);

    });
    afterEach(()  => nock.cleanAll());

    it('adds user to the app with privileges', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { privileges: 'view,deploy' }})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp with view,deploy privileges... done\n`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiV2.done())
        .then(() => apiPrivilegesVariant.done());
    });

    it('raises an error when privileges are not specified', () => {
      error.exit.mock();

      return assert_exit(1, cmd.run({
        app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: {}
      }).then(() => {
        api.done();
        apiV2.done();
        apiPrivilegesVariant.done();
      })).then(function() {
        expect(unwrap(cli.stderr)).to.equal(` ▸    Missing argument: privileges\n`);
      });
    });
  });

  context('with an org app without user privileges', () => {
    beforeEach(() => {
      cli.mockConsole();
      api = stub.getOrgApp();
      apiPrivilegesVariant = stub.postCollaboratorsWithPrivileges();
      apiV2 = stub.orgFlags([]);
    });
    afterEach(()  => nock.cleanAll());

    it('adds user to the app', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: {}})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp... done\n`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiV2.done())
        .then(() => apiPrivilegesVariant.done());
    });
  });

  context('with a non org app', () => {
    beforeEach(() => {
      cli.mockConsole();
      api = stub.getPersonalApp();
      apiPrivilegesVariant = stub.postCollaborators();
    });
    afterEach(()  => nock.cleanAll());

    it('adds user to the app as a collaborator', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: {}})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp... done\n`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiPrivilegesVariant.done());
    });
  });
});
