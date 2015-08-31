var assert = require('chai').assert;
var compareSync = require('dir-compare').compareSync;
var path = require('path');
var fs = require('fs-extra');
var os = require('os');

var init = require('../commands/init')('TEST');

describe('init', function() {

  describe('with a Procfile', function() {

    describe('and an --image flag', function() {
      before(function() {
        this.fixture = fixture('basic');
        init.run({
          debug: true,
          cwd: this.fixture.cwd,
          flags: { image: 'heroku/nodejs' }
        });
      });
      it('generates an app.json, Dockerfile, and docker-compose.yml', function() {
        assert.equal(this.fixture.diff('image-flag'), '[]');
      });
      it('adds newlines to each file so @friism will be able to sleep', function() {
        var appJSON = fs.readFileSync(path.join(this.fixture.cwd, 'app.json'), { encoding: 'utf8' });
        var dockerfile = fs.readFileSync(path.join(this.fixture.cwd, 'Dockerfile'), { encoding: 'utf8' });
        var compose = fs.readFileSync(path.join(this.fixture.cwd, 'docker-compose.yml'), { encoding: 'utf8' });
        assert.equal(appJSON.slice(-1), "\n");
        assert.equal(dockerfile.slice(-1), "\n");
        assert.equal(compose.slice(-1), "\n");
      });
    });

    describe('without an --image flag', function() {
      it('fails with a no-image error', function() {
        var test = fixture('basic');
        assert.throws(init.run.bind(init, {
          debug: true,
          cwd: test.cwd,
          flags: {}
        }), 'docker image required');
      });
    });
  });

  describe('without a Procfile', function() {
    it('fails with a no-Procfile error', function() {
      var tempDir = path.join(os.tmpdir(), 'no-procfile')
      fs.emptyDirSync(tempDir);
      assert.throws(init.run.bind(init, {
        debug: true,
        cwd: tempDir,
        flags: {}
      }), 'Procfile required');
    });
  });

  describe('with existing app.json', function() {

    describe('with no image key or --image flag', function() {
      it('fails with a no-image error', function() {
        var test = fixture('basic');
        assert.throws(init.run.bind(init, {
          debug: true,
          cwd: test.cwd,
          flags: {}
        }), 'docker image required');
      });
    });

    describe('with an image key', function() {
      it('keeps the existing image', function() {
        var test = fixture('app-json');
        init.run({
          debug: true,
          cwd: test.cwd,
          flags: { }
        });
        assert.equal(test.diff('no-image-specified'), '[]');
      });
    });

    describe('with an image key and an --image flag', function() {
      it('replaces the original image with the flagged image', function() {
        var test = fixture('app-json');
        init.run({
          debug: true,
          cwd: test.cwd,
          flags: { image: 'heroku/java' }
        });
        assert.equal(test.diff('image-specified'), '[]');
      });
    });

    describe('with no image key and an --image flag', function() {
      it('adds the flagged image as a key', function() {
        var test = fixture('no-image');
        init.run({
          debug: true,
          cwd: test.cwd,
          flags: { image: 'heroku/ruby' }
        });
        assert.equal(test.diff('image-flag'), '[]');
      });
    });

    describe('with addons', function() {
      it('generates a docker-compose service for each addon', function() {
        var test = fixture('addons');
        init.run({
          debug: true,
          cwd: test.cwd,
          flags: {}
        });
        assert.equal(test.diff('after'), '[]');
      });
    });
  });

  describe('with existing Dockerfile', function() {

    describe('without the --force flag', function() {
      it('fails with an existing-Dockerfile error', function() {
        var test = fixture('has-dockerfile');
        assert.throws(init.run.bind(init, {
          debug: true,
          cwd: test.cwd,
          flags: {}
        }), 'Dockerfile already exists');
      });
    });

    describe('with the --force flag', function() {
      it('overwrites Dockerfile', function() {
        var test = fixture('has-dockerfile');
        init.run({
          debug: true,
          cwd: test.cwd,
          flags: { force: true }
        });
        assert.equal(test.diff('with-force'), '[]');
      });
    });
  });

  describe('with existing docker-compose.yml', function() {

    describe('without the --force flag', function() {
      it('fails with an existing-docker-compose.yml error', function() {
        var test = fixture('has-compose');
        assert.throws(init.run.bind(init, {
          debug: true,
          cwd: test.cwd,
          flags: {}
        }), 'docker-compose.yml already exists');
      });
    });

    describe('with the --force flag', function() {
      it('overwrites docker-compose.yml', function() {

        var test = fixture('has-compose');
        init.run({
          debug: true,
          cwd: test.cwd,
          flags: { force: true }
        });
        assert.equal(test.diff('with-force'), '[]');

      });
    });
  });
});

function fixture(name) {
  var sourceDir = path.join(__dirname, 'fixtures', name);
  var tempDir = path.join(os.tmpdir(), name);
  fs.removeSync(tempDir);
  fs.copySync(path.join(sourceDir, 'before'), tempDir);

  return {
    cwd: tempDir,
    diff: diff
  };

  // test whether or not the after-state is identical
  function diff(resultDir) {
    var diffSet = compareSync(path.join(sourceDir, resultDir), tempDir).diffSet;
    return JSON.stringify(diffSet.filter(notEqual));
  }

  function notEqual(comparison) {
    return comparison.state !== 'equal';
  }
}
