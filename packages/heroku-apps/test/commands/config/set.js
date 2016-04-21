'use strict';

let nock   = require('nock');
let cmd    = require('../../..').commands.find((c) => c.topic === 'config' && c.command === 'set');
let expect = require('unexpected');

describe('config:set', () => {
  beforeEach(() => cli.mockConsole());
  afterEach(() => nock.cleanAll());

  it('sets a config var', () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(200, {RACK_ENV: 'production', RAILS_ENV: 'production'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}]);
    return cmd.run({app: 'myapp', args: ['RACK_ENV=production']})
    .then(() => expect(cli.stdout, 'to equal', 'RACK_ENV: production\n'))
    .then(() => expect(cli.stderr, 'to equal', 'Setting RACK_ENV and restarting myapp... done, v10\n'))
    .then(() => api.done());
  });

  it('sets a config var with an "=" in it', () => {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production=foo'})
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}]);
    return cmd.run({app: 'myapp', args: ['RACK_ENV=production=foo']})
    .then(() => expect(cli.stdout, 'to be empty'))
    .then(() => expect(cli.stderr, 'to equal', 'Setting RACK_ENV and restarting myapp... done, v10\n'))
    .then(() => api.done());
  });
});
