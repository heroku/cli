'use strict';

let nock   = require('nock');
let cmd    = require('../../commands/clients/index');

describe('clients', function() {
  beforeEach(() => cli.mockConsole());

  it('lists the clients', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/oauth/clients')
      .reply(200, [{name: 'awesome', id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e', redirect_uri: 'https://myapp.com'}]);
    return cmd.run({flags: {}})
    .then(() => expect(cli.stdout).to.equal('awesome  f6e8d969-129f-42d2-854b-c2eca9d5a42e  https://myapp.com\n'))
    .then(() => api.done());
  });
});
