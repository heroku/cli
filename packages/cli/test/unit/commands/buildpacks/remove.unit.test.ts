import {Fixture} from '@heroku/buildpack-registry'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('buildpacks:remove', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('-i INDEX', function () {
    it('# with one buildpack successfully removes index', async function () {
      Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-ruby'])
      Stubber.put(api)
      api
        .get('/apps/example/config-vars')
        .reply(200, {})

      const {stdout} = await runCommand(['buildpacks:remove', '-i', '1', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will detect buildpacks normally.
`)
    })

    it('# with one buildpack successfully removes index with language warn', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api)
      api
        .get('/apps/example/config-vars')
        .reply(200, {LANGUAGE_PACK_URL: 'https://github.com/foo/foo'})

      const {stderr, stdout} = await runCommand(['buildpacks:remove', '-i', '1', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed.
`)
      expect(unwrap(stderr)).to.equal('Warning: The LANGUAGE_PACK_URL config var is still set and will be used for the next release\n')
    })

    it('# with one buildpack successfully removes index with buildpack warn', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api)
      api
        .get('/apps/example/config-vars')
        .reply(200, {BUILDPACK_URL: 'https://github.com/foo/foo'})

      const {stderr, stdout} = await runCommand(['buildpacks:remove', '-i', '1', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed.
`)
      expect(unwrap(stderr)).to.equal('Warning: The BUILDPACK_URL config var is still set and will be used for the next release\n')
    })

    it('# with two buildpacks successfully removes index - java', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
      ])

      const {stdout} = await runCommand(['buildpacks:remove', '-i', '2', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-java.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with two buildpacks successfully removes index - ruby', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stdout} = await runCommand(['buildpacks:remove', '-i', '1', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with three buildpacks successfully removes index', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stdout} = await runCommand(['buildpacks:remove', '-i', '2', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# returns an error message when i is not an integer', async function () {
      const {error} = await runCommand(['buildpacks:remove', '-i', 'notaninteger', '-a', 'example'])

      expect(error?.message).to.include('Parsing --index \n\tExpected an integer but received: notaninteger\nSee more help with --help')
    })

    it('# with no buildpacks reports an error removing index', async function () {
      Stubber.get(api)

      const {error} = await runCommand(['buildpacks:remove', '-i', '1', '-a', 'example'])

      expect(error?.message).to.include('No buildpacks were found. Next release on example will detect buildpack normally.')
    })

    it('# returns an error when the index > 1 and the size is one', async function () {
      Stubber.get(api, [
        'https://github.com/foo/foo',
      ])

      const {error} = await runCommand(['buildpacks:remove', '-i', '2', '-a', 'example'])

      expect(error?.message).to.include('Invalid index. Only valid value is 1.')
    })

    it('# returns an error when the index > size and the size > one', async function () {
      Stubber.get(api, [
        'https://github.com/foo/foo',
        'https://github.com/bar/bar',
      ])

      const {error} = await runCommand(['buildpacks:remove', '-i', '3', '-a', 'example'])

      expect(error?.message).to.include('Invalid index. Please choose a value between 1 and 2')
    })
  })

  describe('URL', function () {
    it('# with one buildpack successfully removes url', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api)
      api
        .get('/apps/example/config-vars')
        .reply(200, {})

      const {stdout} = await runCommand(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will detect buildpacks normally.
`)
    })

    it('# with two buildpacks successfully removes url', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-java.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# remove by name should work', async function () {
      Stubber.get(api, [
        {name: 'heroku/ruby', url: 'urn:buildpack:heroku/ruby'},
      ])
      Stubber.put(api)
      api
        .get('/apps/example/config-vars')
        .reply(200, {})

      const buildpack = Fixture.buildpack({
        name: 'ruby',
      })
      nock('https://buildpack-registry.heroku.com')
        .get('/buildpacks/heroku%2Fruby')
        .reply(200, buildpack)

      const {stderr, stdout} = await runCommand(['buildpacks:remove', 'heroku/ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will detect buildpacks normally.
`)
    })

    it('# with no buildpacks reports an error removing buildpack_url', async function () {
      Stubber.get(api)

      const {error} = await runCommand(['buildpacks:remove', 'https://github.com/bar/bar', '-a', 'example'])

      expect(error?.message).to.include('No buildpacks were found. Next release on example will detect buildpack normally.')
    })

    it('# returns an error when the url is not found', async function () {
      Stubber.get(api, [
        'https://github.com/foo/foo',
      ])

      const {error} = await runCommand(['buildpacks:remove', 'https://github.com/bar/bar', '-a', 'example'])

      expect(error?.message).to.include('Buildpack not found. Nothing was removed.')
    })

    it('# with three buildpacks successfully removes url', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])

      const {stdout} = await runCommand(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stdout).to.equal(
        `Buildpack removed. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku main to create a new release using these buildpacks.
`)
    })
  })

  describe('-i INDEX URL', function () {
    it('# returns an error message when i and url are specified', async function () {
      const {error} = await runCommand(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(error?.message).to.include('Please choose either index or Buildpack, but not both.')
    })

    it('# returns an error message neither i or url are specified', async function () {
      const {error} = await runCommand(['buildpacks:remove', '-a', 'example'])

      expect(error?.message).to.include('Usage: heroku buildpacks:remove [BUILDPACK_URL]. Must specify a buildpack to remove, either by index or URL.')
    })
  })
})
