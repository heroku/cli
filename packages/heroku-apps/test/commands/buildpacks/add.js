'use strict'
/* globals describe beforeEach it */

const cli = require('heroku-cli-util')
const nock = require('nock')
const expect = require('chai').expect
const buildpacks = require('../../../commands/buildpacks/add.js')
const error = require('../../../lib/error.js')
const stubGet = require('../../stubs/buildpacks.js').get
const stubPut = require('../../stubs/buildpacks.js').put
const unwrap = require('../../unwrap.js')
const assertExit = require('../../assert_exit.js')

describe('heroku buildpacks:add', function () {
  beforeEach(function () {
    cli.mockConsole()
    error.exit.mock()
  })

  describe('URL', function () {
    it('# maps buildpack names', function () {
      stubGet()

      let mock = nock('https://api.heroku.com')
        .put('/apps/example/buildpack-installations', {
          updates: [{buildpack: 'heroku/ruby'}]
        })
        .reply(200, [{buildpack: {url: 'urn:buildpack:heroku/ruby', name: 'heroku/ruby'}, ordinal: 0}])

      return buildpacks.run({
        app: 'example', args: {url: 'heroku/ruby'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use heroku/ruby.
Run git push heroku master to create a new release using this buildpack.
`)
      })
    })

    it('# does not map buildpack urns', function () {
      stubGet()

      let mock = nock('https://api.heroku.com')
        .put('/apps/example/buildpack-installations', {
          updates: [{buildpack: 'urn:buildpack:heroku/ruby'}]
        })
        .reply(200, [{buildpack: {url: 'urn:buildpack:heroku/ruby', name: 'heroku/ruby'}, ordinal: 0}])

      return buildpacks.run({
        app: 'example', args: {url: 'urn:buildpack:heroku/ruby'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use heroku/ruby.
Run git push heroku master to create a new release using this buildpack.
`)
      })
    })

    it('# with no buildpacks adds the buildpack URL', function () {
      stubGet()

      let mock = stubPut('https://github.com/heroku/heroku-buildpack-ruby')

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku master to create a new release using this buildpack.
`)
      })
    })

    it('# with one existing buildpack adds a buildpack URL to the end of the list', function () {
      stubGet('https://github.com/heroku/heroku-buildpack-java')

      let mock = stubPut(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby'
      )

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku master to create a new release using these buildpacks.
`)
      })
    })

    it('# with two existing buildpacks successfully adds a buildpack URL to the end of the list', function () {
      stubGet(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      )

      let mock = stubPut(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby'
      )

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku master to create a new release using these buildpacks.
`)
      })
    })

    it('# with no buildpacks handles a missing buildpack URL arg', function () {
      return assertExit(1, buildpacks.run({
        app: 'example', args: {}
      })).then(function () {
        expect(cli.stdout).to.equal('')
        expect(cli.stderr).to.equal(
          ` ▸    Usage: heroku buildpacks:add BUILDPACK_URL.
 ▸    Must specify target buildpack URL.
`)
      })
    })

    it('# errors out when already exists', function () {
      stubGet('http://github.com/foobar/foobar')

      return assertExit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/foobar/foobar'}
      })).then(function () {
        expect(unwrap(cli.stderr)).to.equal(' ▸    The buildpack http://github.com/foobar/foobar is already set on your app.\n')
      })
    })

    it('# errors out on unmapped codon urls', function () {
      stubGet('https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz')

      return assertExit(1, buildpacks.run({
        app: 'example', args: {url: 'https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz'}
      })).then(function () {
        expect(unwrap(cli.stderr)).to.equal(' ▸    The buildpack https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz is already set on your app.\n')
      })
    })

    it('# errors out when already exists urn', function () {
      stubGet('urn:buildpack:heroku/ruby')

      return assertExit(1, buildpacks.run({
        app: 'example', args: {url: 'heroku/ruby'}
      })).then(function () {
        expect(cli.stderr).to.equal(' ▸    The buildpack heroku/ruby is already set on your app.\n')
      })
    })
  })

  describe('-i INDEX URL', function () {
    it('# with no buildpacks adds the buildpack URL with index', function () {
      stubGet()

      let mock = stubPut('https://github.com/heroku/heroku-buildpack-ruby')

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '1'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku master to create a new release using this buildpack.
`)
      })
    })

    it('# with one existing buildpack inserts a buildpack URL at index', function () {
      stubGet('https://github.com/heroku/heroku-buildpack-java')

      let mock = stubPut(
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-java'
      )

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '1'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-ruby
  2. https://github.com/heroku/heroku-buildpack-java
Run git push heroku master to create a new release using these buildpacks.
`)
      })
    })

    it('# with two existing buildpacks successfully inserts a buildpack URL at index', function () {
      stubGet(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      )

      let mock = stubPut(
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-nodejs'
      )

      return buildpacks.run({
        app: 'example', args: {url: 'https://github.com/heroku/heroku-buildpack-ruby'},
        flags: {index: '2'}
      }).then(function () {
        mock.done()
        expect(cli.stderr).to.equal('')
        expect(cli.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
  3. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku master to create a new release using these buildpacks.
`)
      })
    })

    it('# returns an error message when i is not an integer', function () {
      return assertExit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
        flags: {index: 'notaninteger'}
      })).then(function () {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Must be greater than 0.\n')
      })
    })

    it('# returns an error message when i < 0', function () {
      return assertExit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
        flags: {index: '-1'}
      })).then(function () {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Must be greater than 0.\n')
      })
    })

    it('# returns an error message when i == 0', function () {
      return assertExit(1, buildpacks.run({
        app: 'example', args: {url: 'http://github.com/bar/bar'},
        flags: {index: '0'}
      })).then(function () {
        expect(cli.stderr).to.equal(' ▸    Invalid index. Must be greater than 0.\n')
      })
    })
  })
})
