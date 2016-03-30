'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/drains');
let expect = require('chai').expect;

describe('drains', function() {
  beforeEach(() => cli.mockConsole());

  it('shows log drains', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/log-drains')
      .reply(200, [{
        token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
        url: 'https://forker.herokuapp.com'}]);
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stderr).to.equal(''))
    .then(() => expect(cli.stdout).to.equal(`=== Drains
https://forker.herokuapp.com (d.8bf587e9-29d1-43c8-bd0e-36cdfaf35259)\n`))
    .then(() => api.done());
  });

  it('shows add-on drains', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/log-drains')
      .reply(200, [{
        addon: {name: 'add-on-123'},
        token: 'd.8bf587e9-29d1-43c8-bd0e-36cdfaf35259',
        url: 'https://forker.herokuapp.com'}])
      .get('/apps/myapp/addons/add-on-123')
      .reply(200, {name: 'add-on-123', plan: {name: 'add-on:test'}});
    return cmd.run({app: 'myapp', flags: {}})
    .then(() => expect(cli.stderr).to.equal(''))
    .then(() => expect(cli.stdout).to.equal(`=== Add-on Drains
add-on:test (add-on-123)\n`))
    .then(() => api.done());
  });
});
