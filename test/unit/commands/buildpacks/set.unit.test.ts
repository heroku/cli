import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub.js'

describe('buildpacks:set', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('URL', function () {
    it('# with no buildpacks sets the buildpack URL', async function () {
      Stubber.get(api)
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack set. Next release on ⬢ example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# errors out when already exists', async function () {
      Stubber.get(api, [
        'https://github.com/foobar/foobar',
      ])

      const {error} = await runCommand(['buildpacks:set', 'https://github.com/foobar/foobar', '-a', 'example'])

      expect(error?.message).to.include('The buildpack https://github.com/foobar/foobar is already set on your app.')
    })

    it('# overwrites in the first when no i is passed', async function () {
      Stubber.get(api, [
        'https://github.com/foo/foo',
        'https://github.com/baz/baz',
        'https://github.com/biz/biz',
      ])
      Stubber.put(api, [
        'https://github.com/bar/bar',
        'https://github.com/baz/baz',
        'https://github.com/biz/biz',
      ])

      const {stdout} = await runCommand(['buildpacks:set', 'https://github.com/bar/bar', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack set. Next release on ⬢ example will use:
  1. https://github.com/bar/bar
  2. https://github.com/baz/baz
  3. https://github.com/biz/biz
Run git push heroku main to create a new release using these buildpacks.
`)
    })
  })

  describe('-i INDEX URL', function () {
    it('# with no buildpacks sets the buildpack URL with index', async function () {
      Stubber.get(api)
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack set. Next release on ⬢ example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with one existing buildpack successfully overwrites an existing buildpack URL at index', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack set. Next release on ⬢ example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with one existing buildpack unsuccessfully fails if buildpack is already set', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {error} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(error?.message).to.include('The buildpack https://github.com/heroku/heroku-buildpack-ruby is already set on your app.')
    })

    it('# with two existing buildpacks successfully overwrites an existing buildpack URL at index', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack set. Next release on ⬢ example will use:
  1. https://github.com/heroku/heroku-buildpack-ruby
  2. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# with two existing buildpacks successfully adds buildpack URL to the end of list', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '3', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack set. Next release on ⬢ example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# with two existing buildpacks successfully adds buildpack URL to the very end of list', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '99', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack set. Next release on ⬢ example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# with two existing buildpacks unsuccessfully fails if buildpack is already set', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])

      const {error} = await runCommand(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-java', '-i', '2', '-a', 'example'])

      expect(error?.message).to.include('The buildpack https://github.com/heroku/heroku-buildpack-java is already set on your app.')
    })

    it('# returns an error message when i is not an integer', async function () {
      const {error} = await runCommand(['buildpacks:set', 'https://github.com/bar/bar', '-i', 'notaninteger', '-a', 'example'])

      expect(error?.message).to.include('Parsing --index \n\tExpected an integer but received: notaninteger\nSee more help with --help')
    })

    it('# returns an error message when i < 0', async function () {
      const {error} = await runCommand(['buildpacks:set', 'https://github.com/bar/bar', '-i', '-1', '-a', 'example'])

      expect(error?.message).to.include('Invalid index. Must be greater than 0.')
    })

    it('# handles a missing buildpack URL arg', async function () {
      const {error} = await runCommand(['buildpacks:set', '-a', 'example'])

      expect(error?.message).to.include(`Missing 1 required arg:
buildpack  namespace/name of the buildpack
See more help with --help`)
    })
  })
})
