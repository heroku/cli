'use strict';

let cli = require('heroku-cli-util');
let cmd = require('../../../commands/pipelines/info');

describe('pipelines:info', function () {
  beforeEach(function () {
    cli.mockConsole();
  });

  it('displays the app info and config vars', function () {
    let self     = this;
    let pipeline = {name: 'example', source_type: 'github', source_repo: 'heroku/example'};
    let apps     = [{name: 'example-staging', stage: 'staging'}, {name: 'example', stage: 'production'}, {name: 'example-admin', stage: 'production'}];

    nock('https://api.heroku.com')
    .get('/pipelines/example')
    .reply(200, pipeline);

    nock('https://api.heroku.com')
    .get('/pipelines/example/apps')
    .reply(200, apps);

    return cmd.run({app: 'example'})
    .then(function () {
      self.cliDebug.should.have.been.calledWith(pipeline);
      self.cliDebug.should.have.been.calledWith(apps);
    });
  });

  it('says "example" when the user is "example"', function () {
    cmd.run({args: {pipeline: 'example'}});
    cli.stdout.should.containe('example');
  });
});
