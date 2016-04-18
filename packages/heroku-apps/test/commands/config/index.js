'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/config');
let expect = require('unexpected');

describe('config', function() {
  beforeEach(() => cli.mockConsole());
  afterEach(() => nock.cleanAll());

  it('shows config vars', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/config-vars')
      .reply(200, {'LANG': 'en_US.UTF-8', 'RACK_ENV': 'production'});
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stdout, 'to equal', '=== myapp Config Vars\nLANG:     en_US.UTF-8\nRACK_ENV: production\n'))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });

  it('shows config vars as JSON', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/config-vars')
      .reply(200, {'LANG': 'en_US.UTF-8', 'RACK_ENV': 'production'});
    return cmd.run({app: 'myapp', flags: {json: true}})
    .then(() => expect(JSON.parse(cli.stdout), 'to satisfy', {RACK_ENV: 'production'}))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });

  it('shows config vars in shell format', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/config-vars')
      .reply(200, {'LANG': 'en_US.UTF-8', 'RACK_ENV': 'production'});
    return cmd.run({app: 'myapp', flags: {shell: true}})
    .then(() => expect(cli.stdout, 'to equal', `LANG='en_US.UTF-8'
RACK_ENV=production
`))
    .then(() => expect(cli.stderr, 'to be empty'))
    .then(() => api.done());
  });
});
