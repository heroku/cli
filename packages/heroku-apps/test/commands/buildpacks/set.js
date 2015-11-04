'use strict';

let expect     = require('chai').expect;
let buildpacks = require('../../../commands/buildpacks/set.js');
let error      = require('../../../lib/error.js');
let stub_get   = require('../../stubs/buildpacks.js').get;
let stub_put   = require('../../stubs/buildpacks.js').put;
let unwrap     = require('../../unwrap.js');
let assert_exit = require('../../assert_exit.js');

describe('heroku buildpacks:set', function() {
  beforeEach(function() {
    cli.mockConsole();
    error.exit.mock();
  });

  describe('URL', function() {
    it('# with no buildpacks sets the buildpack URL', function() {
      stub_get();

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'}
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal("");
        expect(cli.stdout).to.equal(
`Buildpack set. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku master to create a new release using this buildpack.
`);
      });
    });

    it('# errors out when already exists', function() {
      stub_get('http://github.com/foobar/foobar');

      return assert_exit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/foobar/foobar'},
      })).then(function() {
        expect(unwrap(cli.stderr)).to.equal(' ▸    The buildpack http://github.com/foobar/foobar is already set on your app.\n');
      });
    });

    it('# overwrites in the the first when no i is passed', function() {
      stub_get(
        'http://github.com/foo/foo',
        'http://github.com/baz/baz',
        'http://github.com/biz/biz'
      );

      let mock = stub_put(
        'http://github.com/bar/bar',
        'http://github.com/baz/baz',
        'http://github.com/biz/biz'
      );

      return buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack set. Next release on example will use:
  1. http://github.com/bar/bar
  2. http://github.com/baz/baz
  3. http://github.com/biz/biz
Run git push heroku master to create a new release using these buildpacks.
`);
      });
    });

  });

  describe('-i INDEX URL', function() {
    it('# with no buildpacks sets the buildpack URL with index', function() {
      stub_get();

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '1'}
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal("");
        expect(cli.stdout).to.equal(
`Buildpack set. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku master to create a new release using this buildpack.
`);
      });
    });

    it('# with one existing buildpack successfully overwrites an existing buildpack URL at index', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java'
      );

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '1'},
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Buildpack set. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku master to create a new release using this buildpack.
`);
      });
    });

    it('# with one existing buildpack unsuccessfully fails if buildpack is already set', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      return assert_exit(1, buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '1'},
      })).then(function() {
        expect(cli.stdout).to.equal('');
        expect(unwrap(cli.stderr)).to.equal(
` ▸    The buildpack https://github.com/heroku/heroku-buildpack-ruby is already set on your app.
`);
      });
    });

    it('# with two existing buildpacks successfully overwrites an existing buildpack URL at index', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      );

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      );

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '1'},
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Buildpack set. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-ruby
  2. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku master to create a new release using these buildpacks.
`);
      });
    });

    it('# with two existing buildpacks successfully adds buildpack URL to the end of list', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      );

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '3'},
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Buildpack set. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku master to create a new release using these buildpacks.
`);
      });
    });

    it('# with two existing buildpacks successfully adds buildpack URL to the very end of list', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      );

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '99'},
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Buildpack set. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku master to create a new release using these buildpacks.
`);
      });
    });

    it('# with two existing buildpacks unsuccessfully fails if buildpack is already set', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      );

      return assert_exit(1, buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-java'},
        flags: {index: '2'},
      })).then(function() {
        expect(cli.stdout).to.equal('');
        expect(unwrap(cli.stderr)).to.equal(
` ▸    The buildpack https://github.com/heroku/heroku-buildpack-java is already set on your app.
`);
      });
    });

    it('# returns an error message when i is not an integer', function() {
      return assert_exit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
        flags: {index: 'notaninteger'},
      })).then(function() {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Must be greater than 0.\n');
      });
    });

    it('# returns an error message when i < 0', function() {
      return assert_exit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
        flags: {index: '-1'},
      })).then(function() {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Must be greater than 0.\n');
      });
    });

  });

  it('# handles a missing buildpack URL arg', function() {
    return assert_exit(1, buildpacks.run({
      app: 'example', args: {},
    })).then(function() {
      expect(cli.stderr).to.equal(
` ▸    Usage: heroku buildpacks:set BUILDPACK_URL.
 ▸    Must specify target buildpack URL.
`);
      expect(cli.stdout).to.equal('');
    });
  });

});
