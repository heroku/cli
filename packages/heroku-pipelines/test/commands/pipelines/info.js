'use strict';

let cli   = require('heroku-cli-util');
let nock  = require('nock');
let cmd   = require('../../../commands/pipelines/info');

describe('pipelines:info', function () {
  beforeEach(function () {
    cli.mockConsole();
  });

  it('displays the pipeline info and apps', function () {
    let pipeline  = {name: 'example', id: '0123'};
    let pipelines = [pipeline];
    let apps      = [{name: 'example-staging', coupling: {stage: 'staging'}, pipeline: pipeline}, {name: 'example', coupling: {stage: 'production'}, pipeline: pipeline}, {name: 'example-admin', coupling: {stage: 'production'}, pipeline: pipeline}];

    nock('https://api.heroku.com')
      .get('/pipelines')
      .query(true)
      .reply(200, pipelines);

    nock('https://api.heroku.com')
      .get('/pipelines/0123/apps')
      .reply(200, apps);

    return cmd.run({args: {pipeline: 'example'}})
    .then(function () {
      cli.stdout.should.contain('staging:');
      cli.stdout.should.contain('example-staging');
    });
  });
});
