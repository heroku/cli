'use strict';

let nock       = require('nock');
let expect     = require('chai').expect;
let buildpacks = require('../../../commands/buildpacks/clear.js');
let error      = require('../../../lib/error.js');
let unwrap     = require('../../unwrap.js');
let stub_put   = require('../../stubs/buildpacks.js').put;

describe('heroku buildpacks:clear', function() {
  beforeEach(function() {
    cli.mockConsole();
    error.exit.mock();
  });

  it('# clears the buildpack URL', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/config-vars')
    .reply(200, {});

    let mock = stub_put();

    return buildpacks.run({
      app: 'example'
    }).then(function() {
      mock.done();
      expect(cli.stdout).to.equal('Buildpacks cleared. Next release on example will detect buildpack normally.\n');
    });
  });

  it('# clears and warns about buildpack URL config var', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/config-vars')
    .reply(200, {BUILDPACK_URL: 'http://github.com/foo/foo'});

    let mock = stub_put();

    return buildpacks.run({
      app: 'example'
    }).then(function() {
      mock.done();
      expect(cli.stdout).to.equal('Buildpacks cleared.\n');
      expect(unwrap(cli.stderr)).to.equal(' ▸    WARNING: The BUILDPACK_URL config var is still set and will be used for the next release\n');
    });
  });

  it('# clears and warns about language pack URL config var', function() {
    nock('https://api.heroku.com')
    .get('/apps/example/config-vars')
    .reply(200, {LANGUAGE_PACK_URL: 'http://github.com/foo/foo'});

    let mock = stub_put();

    return buildpacks.run({
      app: 'example'
    }).then(function() {
      mock.done();
      expect(cli.stdout).to.equal('Buildpacks cleared.\n');
      expect(unwrap(cli.stderr)).to.equal(' ▸    WARNING: The LANGUAGE_PACK_URL config var is still set and will be used for the next release\n');
    });
  });

});
