'use strict';

const expect = require('chai').expect;
const cli    = require('heroku-cli-util');
const nock   = require('nock');
const cmd    = require('../../../commands/pipelines/promote');

describe('pipelines:promote', function() {
  const api = 'https://api.heroku.com';

  const pipeline = {
    id: '123-pipeline-456',
    name: 'example-pipeline'
  };

  const sourceApp = {
    id: '123-source-app-456',
    name: 'example-staging',
    coupling: { stage: 'staging' },
    pipeline: pipeline
  };

  const targetApp1 = {
    id: '123-target-app-456',
    name: 'example-production',
    coupling: { stage: 'production' },
    pipeline: pipeline
  };

  const targetApp2 = {
    id: '456-target-app-789',
    name: 'example-production-eu',
    coupling: { stage: 'production' },
    pipeline: pipeline
  };

  const sourceCoupling = {
    app: sourceApp,
    id: '123-source-app-456',
    pipeline: pipeline,
    stage: 'staging'
  };

  const promotion = {
    id: '123-promotion-456',
    source: { app: sourceApp },
    status: 'pending'
  };

  beforeEach(function () {
    cli.mockConsole();

    nock(api)
      .get(`/apps/${sourceApp.name}/pipeline-couplings`)
      .reply(200, sourceCoupling);

    nock(api)
      .get(`/pipelines/${pipeline.id}/apps`)
      .reply(200, [sourceApp, targetApp1, targetApp2]);
  });

  it('promotes to all apps in the next stage', function() {
    const req = nock(api).post('/pipeline-promotions', {
      pipeline: { id: pipeline.id },
      source:   { app: { id: sourceApp.id } },
      targets:  [
        { app: { id: targetApp1.id } },
        { app: { id: targetApp2.id } }
      ]
    }).reply(201, promotion);

    let pollCount = 0;
    nock(api)
      .get(`/pipeline-promotions/${promotion.id}/promotion-targets`)
      .twice()
      .reply(200, function() {
        pollCount++;

        return [{
          app: { id: targetApp1.id },
          status: 'successful',
          error_message: null
        }, {
          app: { id: targetApp2.id },
          // Return failed on the second poll loop
          status: pollCount > 1 ? 'failed' : 'pending',
          error_message: pollCount > 1 ? 'Because reasons' : null
        }];
      });

    return cmd.run({ app: sourceApp.name }).then(function() {
      req.done();
      expect(cli.stdout).to.contain('failed');
      expect(cli.stdout).to.contain('Because reasons');
    });
  });
});
