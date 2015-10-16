'use strict';

let nock   = require('nock');
let expect = require('chai').expect;
let cmd    = require('../../../commands/maintenance');

describe('maintenance', function() {
  beforeEach(() => cli.mockConsole());

  it('shows the maintenance is on', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {maintenance: true});
    return cmd.run({app: 'myapp'})
    .then(() => expect(cli.stdout).to.equal('on\n'))
    .then(() => api.done());
  });

  it('shows the maintenance is off', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp')
      .reply(200, {maintenance: false});
    return cmd.run({app: 'myapp'})
    .then(() => expect(cli.stdout).to.equal('off\n'))
    .then(() => api.done());
  });
});
