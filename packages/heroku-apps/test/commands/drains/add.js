'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/drains/add');
let expect = require('chai').expect;

describe('drains:add', function() {
  beforeEach(() => cli.mockConsole());

  it('adds a log drain', function() {
    let api = nock('https://api.heroku.com:443')
      .post('/apps/myapp/log-drains', {url: 'syslog://logs.example.com'})
      .reply(200, {url: 'syslog://logs.example.com'});
    return cmd.run({app: 'myapp', args: {url: 'syslog://logs.example.com'}})
    .then(() => expect(cli.stdout).to.equal('Successfully added drain syslog://logs.example.com\n'))
    .then(() => api.done());
  });
});
