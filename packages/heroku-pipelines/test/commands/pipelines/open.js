'use strict';

const cli     = require('heroku-cli-util');
const cmd     = require('../../../commands/pipelines/open');
const nock    = require('nock');
const promise = require('bluebird');
const sinon   = require('sinon');

describe('pipelines:open', () => {
  let openStub, pipeline;

  beforeEach(() => {
    cli.mockConsole();

    openStub = sinon.stub(cli, 'open').returns(promise.resolve());
    pipeline = { id: '0123', name: 'Rigel' };
  });

  afterEach(function() {
    openStub.restore();
  });

  it('opens the url', () => {
    nock('https://api.heroku.com')
      .get(`/pipelines?eq[name]=${pipeline.name}`)
      .reply(200, [pipeline]);

    return cmd.run({args: {pipeline: pipeline.name}}).then(() => {
      const opened    = openStub.calledOnce;
      const openedUrl = openStub.getCall(0).args[0];

      opened.should.eql(true);
      openedUrl.should.contain('dashboard');
      openedUrl.should.contain(pipeline.id);
    });
  });
});
