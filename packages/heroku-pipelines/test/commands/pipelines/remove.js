'use strict';

const cli  = require('heroku-cli-util');
const nock = require('nock');
const cmd  = require('../../../commands/pipelines/remove');

describe('pipelines:remove', () => {
  beforeEach(() => cli.mockConsole());

  it('displays the right messages', () => {
    const app = 'example';
    const id  = '0123';

    const pipeline_coupling = { id, stage: 'production' };

    nock('https://api.heroku.com')
      .get(`/apps/${app}/pipeline-couplings`)
      .reply(200, pipeline_coupling);

    nock('https://api.heroku.com')
      .delete(`/pipeline-couplings/${id}`)
      .reply(200, pipeline_coupling);

    return cmd.run({ app })
      .then(() => cli.stderr.should.contain(`Removing ${app}... done`));
  });
});
