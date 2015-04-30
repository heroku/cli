var assert = require('chai').assert;
var cli = require('heroku-cli-util');
var path = require('path');
var fse = require('fs-extra');

var fixtures = require('./fixtures');
var init = require('../commands/init')('test');

describe('init', function() {

  describe('with a template override', function() {

    before(function() {
      cli.console.mock();
      this.cwd = fixtures.create('basic-node');
      this.result = init.run({ cwd: this.cwd, args: { template: 'ruby' } });
    });

    after(function() {
      fixtures.destroy();
    });

    it('identifies a ruby app', function() {
      assert.equal(this.result, 'ruby');
    });

    it('creates a Dockerfile', function() {
      var Dockerfile = path.join(this.cwd, 'Dockerfile');
      assert.ok(fse.existsSync(Dockerfile));
    });
  });

});
