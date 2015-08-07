'use strict';

let cli   = require('heroku-cli-util');
let nock  = require('nock');
let cmd   = require('../../../commands/pipelines/create');

describe('pipelines:create', function () {
  beforeEach(function () {
    cli.mockConsole();
  });

  it('displays the pipeline name and app stage', function () {
    let self              = this;
    let pipeline          = {name: 'example', id: '0123'};
    let pipeline_coupling = { id: '0123', stage: "production" };

    nock('https://api.heroku.com')
    .post('/pipelines')
    .reply(201, pipeline);

    nock('https://api.heroku.com')
    .post('/apps/example/pipeline-couplings')
    .reply(201, pipeline_coupling);

    return cmd.run({app: 'example', args: {name: 'example'}, flags: {stage: 'production'}})
    .then(function () {
      cli.stdout.should.contain('example');
      cli.stdout.should.contain('production');
    });
  });
});
