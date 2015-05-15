'use strict';

let nock  = require('nock');
let clone = require('../commands/clone');
let git   = require('../lib/git');

describe('git:clone', function () {
  beforeEach(function () {
    this.git = sinon.mock(git);
  });

  afterEach(function () {
    this.git.verify();
    this.git.restore();
  });

  it('clones the repo', function () {
    nock('https://api.heroku.com')
    .get('/apps/myapp')
    .reply(200, {name: 'myapp'});

    this.git.expects("spawn")
    .withExactArgs(["clone", "-o", "heroku", "https://git.heroku.com/myapp.git", "myapp"])
    .returns(Promise.resolve());

    return clone.run({flags: {app: "myapp"}, args: []});
  });
});
