'use strict';

let nock   = require('nock');
let cmd    = require('../../../commands/regions');
let expect = require('chai').expect;

describe('regions', function() {
  beforeEach(() => cli.mockConsole());

  it('shows regions', function() {
    let api = nock('https://api.heroku.com:443')
      .get('/regions')
      .reply(200, [
        {name: 'eu', description: 'Europe'},
        {name: 'us', description: 'United States'},
      ]);
    return cmd.run({flags: {}})
    .then(() => expect(cli.stdout).to.equal('=== Regions\neu  Europe\nus  United States\n'))
    .then(() => api.done());
  });
});
