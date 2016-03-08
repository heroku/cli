'use strict';

let cmd     = require('../../../commands/access');
let stubGet = require('../../stub/get');

describe('heroku access', () => {
  context('with personal app', () => {
    beforeEach(() => cli.mockConsole());
    afterEach(()  => nock.cleanAll());

    it('shows the app collaborators', () => {
      let apiPersonalApp      = stubGet.personalApp();
      let apiAppCollaborators = stubGet.appCollaborators();

      return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(
`jeff@heroku.com   collaborator
raulb@heroku.com  owner
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => apiPersonalApp.done())
      .then(() => apiAppCollaborators.done());
    });
  });

  context('with a role based access controls org', () => {
    beforeEach(() => cli.mockConsole());
    afterEach(()  => nock.cleanAll());

    it('shows the app collaborators and hides the org collaborator record', () => {
      let apiOrgApp = stubGet.orgApp();
      let apiOrgAppCollaborators = stubGet.orgAppCollaborators();
      let apiOrgFlags = stubGet.orgFlags('');

      return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(
`bob@heroku.com    collaborator
raulb@heroku.com  admin
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => apiOrgApp.done())
      .then(() => apiOrgAppCollaborators.done())
      .then(() => apiOrgFlags.done());
    });
  });

  context('with a org with static privileges', () => {
    beforeEach(() => cli.mockConsole());
    afterEach(()  => nock.cleanAll());

    it('shows the app collaborators and hides the org collaborator record', () => {
      let apiOrgApp = stubGet.orgApp();
      let apiOrgMembers = stubGet.orgMembers();
      let apiAppPrivileges = stubGet.appPrivileges();
      let apiOrgAppCollaboratorsWithPrivileges = stubGet.orgAppCollaboratorsWithPrivileges();
      let apiOrgFlags = stubGet.orgFlags('static-permissions');

      return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(
  `bob@heroku.com    member  deploy,view
raulb@heroku.com  admin   deploy,manage,operate,view
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => apiOrgApp.done())
      .then(() => apiOrgMembers.done())
      .then(() => apiAppPrivileges.done())
      .then(() => apiOrgAppCollaboratorsWithPrivileges.done())
      .then(() => apiOrgFlags.done());
    });

  });

  context('with a org with dynamic privileges', () => {
    beforeEach(() => cli.mockConsole());
    afterEach(()  => nock.cleanAll());

    it('shows the app collaborators and hides the org collaborator record', () => {
      let apiOrgApp = stubGet.orgApp();
      let apiOrgMembers = stubGet.orgMembers();
      let apiAppPrivileges = stubGet.appPrivileges();
      let apiOrgAppCollaboratorsWithPrivileges = stubGet.orgAppCollaboratorsWithPrivileges();
      let apiOrgFlags = stubGet.orgFlags('org-access-controls');

      return cmd.run({app: 'myapp', flags: {}})
      .then(() => expect(
  `bob@heroku.com    member  deploy,view
raulb@heroku.com  admin   deploy,manage,operate,view
`).to.eq(cli.stdout))
      .then(() => expect(``).to.eq(cli.stderr))
      .then(() => apiOrgApp.done())
      .then(() => apiOrgMembers.done())
      .then(() => apiAppPrivileges.done())
      .then(() => apiOrgAppCollaboratorsWithPrivileges.done())
      .then(() => apiOrgFlags.done());
    });
  });

});
