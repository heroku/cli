'use strict';

let cmd       = require('../../../commands/apps/transfer');
let stubGet   = require('../../stub/get');
let stubPost   = require('../../stub/post');
let stubPatch = require('../../stub/patch');

function orgAppTransfer() {
  let api = stubPatch.orgAppTransfer();
  return cmd.run({app: 'myapp', args: {recipient: 'foo@foo.com'}, flags: {}})
  .then(() => expect(``).to.eq(cli.stdout))
  .then(() => expect(`Transferring myapp to foo@foo.com... done\n`).to.eq(cli.stderr))
  .then(() => api.done());
}

function personalAppTransfer() {
  let api = stubPost.personalAppTransfer();
  return cmd.run({app: 'myapp', args: {recipient: 'foo@foo.com'}, flags: {}})
  .then(() => expect(``).to.eq(cli.stdout))
  .then(() => expect(`Initiating transfer of myapp to foo@foo.com... email sent
`).to.eq(cli.stderr))
  .then(() => api.done());
}

describe('heroku apps:transfer', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(()  => nock.cleanAll());

  context('when it is a personal app', () => {
    beforeEach(() => {
      stubGet.personalApp();
    });

    it('transfers the app to a personal account', () => {
      personalAppTransfer();
    });

    it('transfers the app to an organization', () => {
      orgAppTransfer();
    });
  });

  context('when it is an org app', () => {
    beforeEach(() => {
      stubGet.orgApp();
    });

    it('transfers the app to a personal account', () => {
      personalAppTransfer();
    });

    it('transfers the app to an organization', () => {
      orgAppTransfer();
    });

    it('transfers and locks the app if --locked is passed', () => {
      let api = stubPatch.orgAppTransfer();

      let locked_api = nock('https://api.heroku.com:443')
      .get('/organizations/apps/myapp')
      .reply(200, {name: 'myapp', locked: false})
      .patch('/organizations/apps/myapp', {locked: true})
      .reply(200);

      return cmd.run({app: 'myapp', args: {recipient: 'foo@foo.com'}, flags: {locked: true}})
      .then(() => expect(``).to.eq(cli.stdout))
      .then(() => expect(`Transferring myapp to foo@foo.com... done\nLocking myapp... done\n`).to.eq(cli.stderr))
      .then(() => api.done())
      .then(() => locked_api.done());
    });

  });

});
