'use strict';

let nock       = require('nock');
let expect     = require('chai').expect;
let buildpacks = require('../../../commands/buildpacks/remove.js');
let error      = require('../../../lib/error.js');
let unwrap     = require('../../unwrap.js');
let stub_get   = require('../../stubs/buildpacks.js').get;
let stub_put   = require('../../stubs/buildpacks.js').put;
let assert_exit = require('../../assert_exit.js');

describe('heroku buildpacks:remove', function() {
  beforeEach(function() {
    cli.mockConsole();
    error.exit.mock();
  });

  describe('-i INDEX', function() {
    it('# with one buildpack successfully removes index', function() {
      nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {});

      stub_get(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put();

      return buildpacks.run({
        app: 'example', flags: {index: '1'},
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will detect buildpack normally.
`);
      });
    });

    it('# with one buildpack successfully removes index with langauge warn', function() {
      nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {LANGUAGE_PACK_URL: 'http://github.com/foo/foo'});

      stub_get(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put();

      return buildpacks.run({
        app: 'example', flags: {index: '1'},
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed.
`);
        expect(unwrap(cli.stderr)).to.equal(' ▸    WARNING: The LANGUAGE_PACK_URL config var is still set and will be used for the next release\n');
      });
    });

    it('# with one buildpack successfully removes index with buildpack warn', function() {
      nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {BUILDPACK_URL: 'http://github.com/foo/foo'});

      stub_get(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put();
      return buildpacks.run({
        app: 'example', flags: {index: '1'},
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed.
`);
        expect(unwrap(cli.stderr)).to.equal(' ▸    WARNING: The BUILDPACK_URL config var is still set and will be used for the next release\n');
      });
    });

    it('# with two buildpacks successfully removes index', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java', 
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put('https://github.com/heroku/heroku-buildpack-java');

      return buildpacks.run({
        app: 'example', flags: {index: '2'},
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-java.
Run git push heroku master to create a new release using this buildpack.
`);
      });
    });

    it('# with two buildpacks successfully removes index', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java', 
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put('https://github.com/heroku/heroku-buildpack-ruby');

      return buildpacks.run({
        app: 'example', flags: {index: '1'},
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku master to create a new release using this buildpack.
`);
      });
    });

    it('# with three buildpacks successfully removes index', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby'
      );
      return buildpacks.run({
        app: 'example', flags: {index: '2'},
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku master to create a new release using these buildpacks.
`);
      });
    });

    it('# returns an error message when i is not an integer', function() {
      return assert_exit(1, buildpacks.run({
        app: 'example', flags: {index: 'notaninteger'},
      })).then(function() {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Must be greater than 0.\n');
      });
    });

    it('# with no buildpacks reports an error removing index', function() {
      stub_get();

      return assert_exit(1, buildpacks.run({
        app: 'example', flags: {index: '1'},
      })).then(function() {
        expect(unwrap(cli.stderr)).to.equal(' ▸    No buildpacks were found. Next release on example will detect buildpack normally.\n');
      });
    });

    it('# returns an error when the index > 1 and the size is one', function() {
      stub_get('http://github.com/foo/foo');

      return assert_exit(1, buildpacks.run({
        app: 'example', flags: {index: '2'},
      })).then(function() {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Only valid value is 1.\n');
      });
    });

    it('# returns an error when the index > size and the size > one', function() {
      stub_get(
        'http://github.com/foo/foo',
        'http://github.com/bar/bar'
      );

      return assert_exit(1, buildpacks.run({
        app: 'example', flags: {index: '3'},
      })).then(function() {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Please choose a value between 1 and 2\n');
      });
    });
  });

  describe('URL', function() {
    it('# with one buildpack successfully removes url', function() {
      nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {});

      stub_get(
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put();

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'}
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will detect buildpack normally.
`);
      });
    });

    it('# with two buildpacks successfully removes url', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java', 
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put('https://github.com/heroku/heroku-buildpack-java');

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'}
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-java.
Run git push heroku master to create a new release using this buildpack.
`);
      });
    });

    it('# remove by name should work', function() {
      stub_get(
        'urn:buildpack:heroku/ruby'
      );

      let mock = stub_put();

      nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {});

      return buildpacks.run({
        app: 'example', args: {url: 'heroku/ruby'}
      }).then(function() {
        mock.done();
        expect(cli.stderr).to.equal('');
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will detect buildpack normally.
`);
      });
    });

    it('# with no buildpacks reports an error removing buildpack_url', function() {
      stub_get();

      return assert_exit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
      })).then(function() {
        expect(unwrap(cli.stderr)).to.equal(' ▸    No buildpacks were found. Next release on example will detect buildpack normally.\n');
      });
    });

    it('# returns an error when the url is not found', function() {
      stub_get('http://github.com/foo/foo');

      return assert_exit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
      })).then(function() {
        expect(cli.stderr).to.equal(' ▸    Buildpack not found. Nothing was removed.\n');
      });
    });

    it('# with three buildpacks successfully removes url', function() {
      stub_get(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby'
      );

      let mock = stub_put(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      );
      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'}
      }).then(function() {
        mock.done();
        expect(cli.stdout).to.equal(
`Buildpack removed. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku master to create a new release using these buildpacks.
`);
      });
    });

  });

  describe('-i INDEX URL', function() {
    it('# returns an error message when i and url are specified', function() {
      return assert_exit(1, buildpacks.run({
        app: 'example', flags: {index: '1'}, args: {url: 'http://github.com/foo/foo'}
      })).then(function() {
        expect(unwrap(cli.stderr)).to.equal(' ▸    Please choose either index or Buildpack URL, but not both.\n');
      });
    });
  });

  it('# returns an error message neither i or url are specified', function() {
    return assert_exit(1, buildpacks.run({
      app: 'example'
    })).then(function() {
      expect(unwrap(cli.stderr)).to.equal(
` ▸    Usage: heroku buildpacks:remove [BUILDPACK_URL]. Must specify a buildpack to remove, either by index or URL.
`);
    });
  });

});
