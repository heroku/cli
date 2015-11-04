'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/config');
let expect = require('chai').expect;

describe('config', function() {
  beforeEach(() => cli.mockConsole());

  it('shows config vars', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/config-vars')
      .reply(200, {'LANG': 'en_US.UTF-8', 'RACK_ENV': 'production'});
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stdout).to.equal('=== myapp Config Vars\nLANG:     en_US.UTF-8\nRACK_ENV: production\n'))
    .then(() => api.done());
  });
});
