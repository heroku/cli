'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/config/unset').unset;
let expect = require('chai').expect;

describe('config:unset', function() {
  beforeEach(() => cli.mockConsole());

  it('removes a config var', function() {
    let api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/config-vars', {FOO: null})
      .reply(200);
    return cmd.run({app: 'myapp', args: ['FOO']})
    .then(() => expect(cli.stderr).to.equal('Unsetting FOO and restarting myapp... done\n'))
    .then(() => api.done());
  });
});
