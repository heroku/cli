'use strict';

let sinon      = require('sinon');
let nock       = require('nock');
let proxyquire = require('proxyquire');
let git        = require('./mock/git');
let remote     = proxyquire('../commands/git/remote', {'../../lib/git': function () { return git; }});
let expect     = require('chai').expect;

describe('git:remote', function () {
  it('adds an http-git remote', function () {
    let exec = sinon.spy(git, "exec");
    nock('https://api.heroku.com')
    .get('/apps/myapp')
    .reply(200, {name: 'myapp'});

    return remote.run({flags: {app: "myapp"}, args: []})
    .then(function () {
      expect(exec).to.have.been.calledWith(['remote', 'set-url', 'heroku', 'https://git.heroku.com/myapp.git']);
      expect(cli.stdout).to.equal("set git remote heroku to https://git.heroku.com/myapp.git\n");
    });
  });
});
