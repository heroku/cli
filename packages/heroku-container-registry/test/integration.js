var assert = require('chai').assert;
var fse = require('fs-extra');
var os = require('os');
var path = require('path');
var uuid = require('uuid');
var cli = require('heroku-cli-util');
var child = require('child_process');
var stream = require('stream');

var fixtures = require('./fixtures');
var docker = require('../lib/docker');
var init = require('../commands/init')('test');
var exec = require('../commands/exec')('test');
var start = require('../commands/start')('test');
var release = require('../commands/release')('test');
var clean = require('../commands/clean')('clean');

describe('integration (basic-node)', function() {

  before(function() {
    this.cwd = fixtures.create('basic-node');
    docker.silent = true;
  });

  after(function() {
    fixtures.destroy();
  });

  describe('init', function() {

    before(function(done) {
      cli.console.mock();
      this.result = init.run({ cwd: this.cwd, args: {} });
      done();
    });

    it('identifies a node app', function() {
      assert.equal(this.result, 'node');
    });

    it('creates a Dockerfile', function() {
      var Dockerfile = path.join(this.cwd, 'Dockerfile');
      assert.ok(fse.existsSync(Dockerfile));
    });
  });

  describe('exec npm install', function() {

    before(function(done) {
      cli.console.mock();
      exec.run({ cwd: this.cwd, args: ['npm', 'install'] });
      done();
    });

    it('creates node_modules', function() {
      var node_modules = path.join(this.cwd, 'node_modules');
      assert.ok(fse.existsSync(node_modules));
    });
  });

  describe('start', function() {

    before(function(done) {
      cli.console.mock();
      this.result = start.run({ cwd: this.cwd, args: [] }).trim();
      done();
    });

    it('runs the web process', function() {
      assert.equal(this.result, 'here is the web process');
    });
  });

  describe('release', function() {

    before(function(done) {
      cli.console.mock();
      this.app = new MockApp();
      this.req = new MockRequest();
      release.run({
        cwd: this.cwd,
        heroku: {},
        request: this.req.stream,
        app: this.app
      }).then(done, done);
    });

    it('creates a slug', function() {
      assert.equal(this.app.id, this.app.response.id);
      assert.equal(this.app.process_types.web, "echo 'here is the web process'");
    });

    it('releases a slug', function() {
      assert.ok(this.req.size > 9000000 && this.req.size < 12000000); // between 9 and 12 MB
      assert.equal(this.req.url, this.app.response.blob.url);
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

function MockApp() {
  this.process_types = undefined;
  this.id = undefined;
  this.response = {
    id: 'slug-id-123',
    blob: { url: 'http://api.heroku.com/slug/123' }
  };
}

MockApp.prototype.info = function() {
  return Promise.resolve();
};

MockApp.prototype.slugs = function() {
  return {
    create: this.createSlug.bind(this)
  };
};

MockApp.prototype.createSlug = function(obj) {
  this.process_types = obj.process_types;
  return this.response;
};

MockApp.prototype.releases = function() {
  return {
    create: this.createRelease.bind(this)
  };
};

MockApp.prototype.createRelease = function(obj) {
  this.id = obj.slug;
};

function MockRequest() {
  var self = this;
  self.url = undefined;
  self.size = 0;

  self.stream = function(options) {
    var length = parseInt(options.headers['content-length'], 10);
    self.url = options.url;
    return new stream.Writable({
      write: function(chunk, encoding, next) {
        self.size += chunk.length;
        if (self.size >= length) {
          this.emit('response');
        }
        next();
      }
    });
  }
}
