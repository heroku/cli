var assert = require('chai').assert;
var fse = require('fs-extra');
var os = require('os');
var path = require('path');
var uuid = require('uuid');
var cli = require('heroku-cli-util');
var child = require('child_process');

var docker = require('../lib/docker');
var init = require('../commands/init')('test');
var exec = require('../commands/exec')('test');
var start = require('../commands/start')('test');
var clean = require('../commands/clean')('clean');

describe('basic integration', function() {
  var cwd = createFixture('basic');
  docker.silent = true;

  after(function() {
    fse.removeSync(path.join(__dirname, 'tmp'));
  });

  describe('init', function() {

    before(function(done) {
      cli.console.mock();
      this.result = init.run({ cwd: cwd, args: {} });
      done();
    });

    it('identifies a node app', function() {
      assert.equal(this.result, 'node');
    });

    it('creates a Dockerfile', function() {
      var Dockerfile = path.join(cwd, 'Dockerfile');
      assert.ok(fse.existsSync(Dockerfile));
    });
  });

  describe('exec npm install', function() {

    before(function(done) {
      cli.console.mock();
      exec.run({ cwd: cwd, args: ['npm', 'install'] });
      done();
    });

    it('creates node_modules', function() {
      var node_modules = path.join(cwd, 'node_modules');
      assert.ok(fse.existsSync(node_modules));
    });
  });

  describe('start', function() {

    before(function(done) {
      cli.console.mock();
      this.result = start.run({ cwd: cwd, args: [] });
      console.log('this.result:', this.result);
      done();
    });

    it('runs the web process', function() {
      assert.equal(this.result, 'here is the web process');
    });
  });

  describe('clean', function() {

    before(function(done) {
      cli.console.mock();
      this.initial = child.execSync('docker images').toString().trim().split('\n');
      this.result = clean.run({ });
      this.remaining = child.execSync('docker images').toString().trim().split('\n');
      done();
    });

    it('should remove at least 2 images', function() {
      assert.ok(this.result.length >= 2);
      assert.equal(this.remaining.join('').indexOf('heroku-docker'), -1);
    });

    it('should leave all other images', function() {
      assert.equal(this.remaining.length, this.initial.length - this.result.length);
    });
  });
});

function createFixture(name) {
  var source = path.join(__dirname, 'fixtures', name);
  var dest = path.join(__dirname, 'tmp', uuid.v1());
  fse.ensureDirSync(dest);
  fse.copySync(source, dest);
  return dest;
}
