'use strict';

let cmd           = require('../../../commands/access/remove');
let stub          = require('../../stub');
let api;

describe('heroku access:remove', () => {
  context('with either a personal or org app', () => {
    beforeEach(() => {
      cli.mockConsole();
      api = stub.deleteCollaboratorsPersonalApp('myapp','raulb@heroku.com');
    });
    afterEach(()  => nock.cleanAll());

    it('removes the user from an app', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}})
      .then(() => expect(``).to.eq(cli.stdout))
        .then(() => expect(`Removing raulb@heroku.com access from the app myapp... done\n`).to.eq(cli.stderr))
        .then(() => api.done());
    });

  });
});
