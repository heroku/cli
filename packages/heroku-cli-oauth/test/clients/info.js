'use strict';

let nock   = require('nock');
let cmd    = require('../../commands/clients/info');
let expect = require('chai').expect;

describe('clients:info', function() {
  beforeEach(() => cli.mockConsole());

  it('gets the client info', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/oauth/clients/f6e8d969-129f-42d2-854b-c2eca9d5a42e')
      .reply(200, {
        name: 'awesome',
        id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e',
        redirect_uri: 'https://myapp.com'
      });
    return cmd.run({args: {id: 'f6e8d969-129f-42d2-854b-c2eca9d5a42e'}, flags: {}})
    .then(() => expect(cli.stdout).to.equal(`=== awesome
id:           f6e8d969-129f-42d2-854b-c2eca9d5a42e
name:         awesome
redirect_uri: https://myapp.com
`))
    .then(() => api.done());
  });
});
