'use strict';

let cmd           = require('../../../commands/access/add');
let error         = require('../../../lib/error');
let assert_exit   = require('../../assert_exit');
let unwrap        = require('../../unwrap');
let stubGet       = require('../../stub/get');
let stubPost      = require('../../stub/post');
let api;
let apiPrivilegesVariant;
let apiV2;

describe('heroku access:add', () => {
  context('with an org app with user privileges', () => {
    beforeEach(() => {
      cli.mockConsole();
      api = stubGet.orgApp();
      apiPrivilegesVariant = stubPost.collaboratorsWithPrivileges(['deploy', 'view']);
      apiV2 = stubGet.orgFlags(['org-access-controls']);

    });
    afterEach(()  => nock.cleanAll());

    it('adds user to the app with privileges, and view is implicit', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { privileges: 'deploy' }})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp with deploy,view privileges... done\n`).to.eq(cli.stderr))
        .then(() => api.done())
        .then(() => apiV2.done())
        .then(() => apiPrivilegesVariant.done());
    });

    it('adds user to the app with privileges, even specifying the view privilege', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}, flags: { privileges: 'deploy,view' }})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Adding raulb@heroku.com access to the app myapp with deploy,view privileges... done\n`).to.eq(cli.stderr))
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
      api = stubGet.orgApp();
      apiPrivilegesVariant = stubPost.collaborators();
      apiV2 = stubGet.orgFlags([]);
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
      api = stubGet.personalApp();
      apiPrivilegesVariant = stubPost.collaborators();
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
