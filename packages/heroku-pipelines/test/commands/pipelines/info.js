'use strict';

const cli  = require('heroku-cli-util');
const nock = require('nock');
const cmd  = require('../../../commands/pipelines/info');

describe('pipelines:info', function () {
  let pipeline, pipelines, couplings, apps;

  beforeEach(function () {
    cli.mockConsole();

    pipeline  = { name: 'example', id: '0123' };
    pipelines = [ pipeline ];

    couplings = [
      {
        stage: 'staging',
        app: { id: 'app-1'}
      },
      {
        stage: 'production',
        app: { id: 'app-2'}
      },
      {
        stage: 'production',
        app: { id: 'app-3'}
      }
    ];

    apps = [
      {
        id: 'app-1',
        name: 'example-staging' ,
        pipeline: pipeline
      },
      {
        id: 'app-2',
        name: 'example',
        pipeline: pipeline
      },
      {
        id: 'app-3',
        name: 'example-admin',
        pipeline: pipeline
      }
    ];
  });

  it('displays the pipeline info and apps', function () {
    nock('https://api.heroku.com')
      .get('/pipelines')
      .query(true)
      .reply(200, pipelines);

    nock('https://api.heroku.com')
      .get('/pipelines/0123/pipeline-couplings')
      .reply(200, couplings);

    nock('https://api.heroku.com')
      .post('/filters/apps')
      .reply(200, apps);

    return cmd.run({ args: { pipeline: 'example' } }).then(() => {
      cli.stdout.should.contain('staging:');
      cli.stdout.should.contain('example-staging');
    });
  });
});
