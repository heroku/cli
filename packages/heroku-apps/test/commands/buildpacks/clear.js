'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const buildpacks = require('../../../commands/buildpacks/clear.js')
const error = require('../../../lib/error.js')
const unwrap = require('../../unwrap.js')
const stubPut = require('../../stubs/buildpacks.js').put

describe('heroku buildpacks:clear', function () {
  beforeEach(function () {
    cli.mockConsole()
    error.exit.mock()
  })

  it('# clears the buildpack URL', function () {
    nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {})

    let mock = stubPut()

    return buildpacks.run({
      app: 'example'
    }).then(function () {
      mock.done()
      expect(cli.stdout).to.equal('Buildpacks cleared. Next release on example will detect buildpack normally.\n')
    })
  })

  it('# clears and warns about buildpack URL config var', function () {
    nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {BUILDPACK_URL: 'http://github.com/foo/foo'})

    let mock = stubPut()

    return buildpacks.run({
      app: 'example'
    }).then(function () {
      mock.done()
      expect(cli.stdout).to.equal('Buildpacks cleared.\n')
      expect(unwrap(cli.stderr)).to.equal(' ▸    The BUILDPACK_URL config var is still set and will be used for the next release\n')
    })
  })

  it('# clears and warns about language pack URL config var', function () {
    nock('https://api.heroku.com')
      .get('/apps/example/config-vars')
      .reply(200, {LANGUAGE_PACK_URL: 'http://github.com/foo/foo'})

    let mock = stubPut()

    return buildpacks.run({
      app: 'example'
    }).then(function () {
      mock.done()
      expect(cli.stdout).to.equal('Buildpacks cleared.\n')
      expect(unwrap(cli.stderr)).to.equal(' ▸    The LANGUAGE_PACK_URL config var is still set and will be used for the next release\n')
    })
  })
})
