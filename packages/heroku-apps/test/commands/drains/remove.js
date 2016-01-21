'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/drains/remove');
let expect = require('chai').expect;

describe('drains:remove', function() {
  beforeEach(() => cli.mockConsole());

  it('adds a log drain', function() {
    let api = nock('https://api.heroku.com:443')
      .delete('/apps/myapp/log-drains/syslog%3A%2F%2Flogs.example.com')
      .reply(200, {url: 'syslog://logs.example.com'});
    return cmd.run({app: 'myapp', args: {url: 'syslog://logs.example.com'}})
    .then(() => expect(cli.stdout).to.equal('Successfully removed drain syslog://logs.example.com\n'))
    .then(() => api.done());
  });
});
