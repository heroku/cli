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
    let api = nock('https://api.heroku.com:443');

    api.get('/apps/myapp/addons/slowdb')
       .reply(200, {id: 'slowdb', web_url: 'http://slowdb'});

    api.get('/addons/slowdb/addon-attachments')
       .reply(200, []);

    return cmd.run({app: 'myapp', args: {addon: 'slowdb'}})
      .then(() => expect(opnMock.url).to.equal('http://slowdb'))
      .then(() => expect(cli.stdout).to.equal('Opening http://slowdb...\n'))
      .then(() => api.done());
  });

  it('opens an attached addon, by slug, with the correct `context_app`', function() {
    let api = nock('https://api.heroku.com:443');

    api.get('/apps/myapp-2/addon-attachments/slowdb')
       .reply(404);

    api.get('/apps/myapp-2/addons/slowdb')
       .reply(404);

    api.get('/addons/slowdb')
       .reply(200, {id: 'c7c9cf20-ec87-11e5-aea4-0002a5d5c51b', web_url: 'http://myapp-slowdb'});

    api.get('/addons/c7c9cf20-ec87-11e5-aea4-0002a5d5c51b/addon-attachments')
       .reply(200, [
         {app: {name: 'myapp'},   web_url: 'http://myapp-slowdb'},
         {app: {name: 'myapp-2'}, web_url: 'http://myapp-2-slowdb'}]);

    return cmd.run({app: 'myapp-2', args: {addon: 'slowdb'}})
      .then(() => expect(opnMock.url).to.equal('http://myapp-2-slowdb'))
      .then(() => expect(cli.stdout).to.equal('Opening http://myapp-2-slowdb...\n'))
      .then(() => api.done());
  });
});
