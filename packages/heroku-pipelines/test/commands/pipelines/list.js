'use strict';

const cli  = require('heroku-cli-util');
const nock = require('nock');
const cmd  = require('../../../commands/pipelines/list');

describe('pipelines:list', () => {
  beforeEach(() => cli.mockConsole());

  it('displays the right messages', () => {
    const pipelines = [
      { id: '0123', name: 'Betelgeuse' },
      { id: '9876', name: 'Sirius' }
    ];

    nock('https://api.heroku.com')
      .get(`/pipelines`)
      .reply(200, pipelines);

    return cmd.run({}).then(() => {
      const output = cli.stdout;

      output.should.contain('My Pipelines');
      output.should.contain('Betelgeuse');
      output.should.contain('Sirius');
    });
  });
});
