'use strict';

let nock   = require('nock');
let remote = require('../commands/remote');
let git    = require('../lib/git');

describe('git:remote', function () {
  beforeEach(function () {
    this.git = sinon.mock(git);
  });

  afterEach(function () {
    this.git.verify();
    this.git.restore();
  });

  it('adds an http-git remote', function () {
    nock('https://api.heroku.com')
    .get('/apps/myapp')
    .reply(200, {name: 'myapp'});

    this.git.expects("exec")
    .withExactArgs(["config", "heroku.remote"])
    .returns(Promise.resolve(""));

    this.git.expects("exec")
    .withExactArgs(["remote"])
    .returns(Promise.resolve(""));

    this.git.expects("exec")
    .withExactArgs(["remote", "add", "heroku", "https://git.heroku.com/myapp.git"])
    .returns(Promise.resolve(""));

    return remote.run({flags: {app: "myapp"}, args: []})
    .then(function () {
      cli.stdout.should.equal("set git remote heroku to https://git.heroku.com/myapp.git\n");
    });
  });
});
