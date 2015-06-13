'use strict';

let cli    = require('heroku-cli-util');
let cmd    = require('../../commands/hello/world');

describe('hello:world', function () {
  beforeEach(function () {
    cli.mockConsole();
  });

  it('says "Hello, World!" when no user is specified', function () {
    cmd.run({flags: {}});
    cli.stdout.should.equal('Hello, World!\n');
  });

  it('says "Hello, Jeff!" when the user is "Jeff"', function () {
    cmd.run({flags: {user: 'Jeff'}});
    cli.stdout.should.equal('Hello, Jeff!\n');
  });
});
