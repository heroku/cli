'use strict';

let cli   = require('heroku-cli-util');
let nock  = require('nock');
let cmd   = require('../../../commands/pipelines/create');

describe('pipelines:create', function () {
  beforeEach(function () {
    cli.mockConsole();
  });

  it('displays the pipeline name and app stage', function () {
    let pipeline          = {name: 'example', id: '0123'};
    let pipeline_coupling = { id: '0123', stage: "production" };

    let heroku = nock('https://api.heroku.com')
      .post('/pipelines')
      .reply(201, pipeline)
      .post('/pipeline-couplings')
      .reply(201, pipeline_coupling);

    return cmd.run({app: 'example', args: {name: 'example'}, flags: {stage: 'production'}})
    .then(function () {
      cli.stderr.should.contain('Creating example pipeline... done');
      cli.stderr.should.contain('Adding example to example pipeline as production... done');
      heroku.done();
    });
  });
});
