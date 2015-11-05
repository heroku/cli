'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/config/set').set;
let expect = require('chai').expect;

describe('config:set', function() {
  beforeEach(() => cli.mockConsole());

  it('sets a config var', function() {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(200, {RACK_ENV: 'production', RAILS_ENV: 'production'});
    return cmd.run({app: 'myapp', args: ['RACK_ENV=production']})
    .then(() => expect(cli.stdout).to.equal('RACK_ENV: production\n'))
    .then(() => expect(cli.stderr).to.equal('Setting config vars and restarting myapp... done\n'))
    .then(() => api.done());
  });

  it('sets a config var with an "=" in it', function() {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production=foo'})
      .reply(200);
    return cmd.run({app: 'myapp', args: ['RACK_ENV=production=foo']})
    .then(() => expect(cli.stderr).to.equal('Setting config vars and restarting myapp... done\n'))
    .then(() => api.done());
  });
});
