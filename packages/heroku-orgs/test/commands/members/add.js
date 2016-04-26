'use strict';

let cmd = require('../../../commands/members/add').add;
let stubGet = require('../../stub/get');

describe('heroku members:add', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  it('adds a member to an org', () => {
    stubGet.variableSizeOrgMembers(1);
    stubGet.userFeatureFlags([]);
    let api = nock('https://api.heroku.com:443')
    .put('/organizations/myorg/members', {email: 'foo@foo.com', role: 'admin'})
    .reply(200);

    return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
    .then(() => expect(``).to.eq(cli.stdout))
    .then(() => expect(`Adding foo@foo.com to myorg as admin... done\n`).to.eq(cli.stderr))
    .then(() => api.done());
  });

  context('adding a member with the standard org creation flag', () => {
    beforeEach(() => {
      stubGet.userFeatureFlags([{name: 'standard-org-creation'}]);
    });

    it('does not warn the user when under the free org limit', () => {
      stubGet.variableSizeOrgMembers(1);
      let api = nock('https://api.heroku.com:443')
      .put('/organizations/myorg/members', {email: 'foo@foo.com', role: 'admin'})
      .reply(200);

      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
      .then(() => expect(``).to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done\n`).to.eq(cli.stderr))
      .then(() => api.done());
    });

    it('does not warn the user when over the free org limit', () => {
      stubGet.variableSizeOrgMembers(7);
      let api = nock('https://api.heroku.com:443')
      .put('/organizations/myorg/members', {email: 'foo@foo.com', role: 'admin'})
      .reply(200);

      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
      .then(() => expect(``).to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done\n`).to.eq(cli.stderr))
      .then(() => api.done());
    });

    it('does warn the user when at the free org limit', () => {
      stubGet.variableSizeOrgMembers(6);
      let api = nock('https://api.heroku.com:443')
      .put('/organizations/myorg/members', {email: 'foo@foo.com', role: 'admin'})
      .reply(200);

      return cmd.run({org: 'myorg', args: {email: 'foo@foo.com'}, flags: {role: 'admin'}})
      .then(() => expect(`You'll be billed monthly for teams over 5 members.\n`).to.eq(cli.stdout))
      .then(() => expect(`Adding foo@foo.com to myorg as admin... done\n`).to.eq(cli.stderr))
      .then(() => api.done());
    });
  });
});
