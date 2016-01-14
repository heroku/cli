'use strict';

let cli        = require('heroku-cli-util');
let nock       = require('nock');
let proxyquire = require('proxyquire');
let opnMock    = require('../../opn');
let cmd        = proxyquire('../../../commands/addons/open', {'opn': opnMock});
let expect     = require('chai').expect;

describe('addons:open', function() {
  beforeEach(() => cli.mockConsole());

  it('opens the addon dashboard', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/addons/slowdb')
      .reply(200, {web_url: 'http://slowdb'});
    return cmd.run({app: 'myapp', args: {addon: 'slowdb'}})
    .then(() => expect(opnMock.url).to.equal('http://slowdb'))
    .then(() => expect(cli.stdout).to.equal('Opening http://slowdb...\n'))
    .then(() => api.done());
  });
});
