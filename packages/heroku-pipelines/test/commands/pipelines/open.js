'use strict';

const cli     = require('heroku-cli-util');
const cmd     = require('../../../commands/pipelines/open');
const nock    = require('nock');
const promise = require('bluebird');
const sinon   = require('sinon');

describe('pipelines:open', () => {
  beforeEach(() => cli.mockConsole());

  it('opens the url', () => {
    const openStub = sinon.stub(cli, 'open').returns(promise.resolve());
    const pipeline = { id: '0123', name: 'Rigel' };

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
