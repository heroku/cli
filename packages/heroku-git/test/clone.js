'use strict';

let sinon      = require('sinon');
let nock       = require('nock');
let expect     = require('chai').expect;
let proxyquire = require('proxyquire');
let git        = require('./mock/git');
let clone      = proxyquire('../commands/git/clone', {'../../lib/git': function () { return git; }});

describe('git:clone', function () {
  it('clones the repo', function () {
    let spawn = sinon.spy(git, "spawn");
    nock('https://api.heroku.com')
    .get('/apps/myapp')
    .reply(200, {name: 'myapp'});

    return clone.run({flags: {app: "myapp"}, args: []})
    .then(function () {
      expect(spawn).to.have.been.calledWith([
        "clone", "-o", "heroku", "https://git.heroku.com/myapp.git", "myapp"
      ]);
    });
  });
});
