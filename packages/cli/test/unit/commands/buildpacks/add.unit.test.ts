import {Fixture} from '@heroku/buildpack-registry'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub.js'

describe('buildpacks:add', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  describe('URL', function () {
    it('# maps buildpack names', async function () {
      const registry = new Map()
      registry.set('https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz',
        {name: 'hone/test', url: 'urn:buildpack:hone/test'})

      Stubber.get(api)
      Stubber.put(api, ['https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz'], registry)

      const buildpack = Fixture.buildpack({
        blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz',
        name: 'test',
        namespace: 'hone',
      })

      nock('https://buildpack-registry.heroku.com')
        .get('/buildpacks/hone%2Ftest')
        .times(2)
        .reply(200, buildpack)

      const {stderr, stdout} = await runCommand(['buildpacks:add', 'hone/test', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use hone/test.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with no buildpacks adds the buildpack URL', async function () {
      Stubber.get(api)
      Stubber.put(api, ['https://github.com/heroku/heroku-buildpack-ruby'])

      const {stderr, stdout} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with one existing buildpack adds a buildpack URL to the end of the list', async function () {
      Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-java'])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# with two existing buildpacks successfully adds a buildpack URL to the end of the list', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# errors out when already exists', async function () {
      Stubber.get(api, ['https://github.com/foobar/foobar'])

      const {error} = await runCommand(['buildpacks:add', 'https://github.com/foobar/foobar', '-a', 'example'])

      expect(error?.message).to.include('The buildpack https://github.com/foobar/foobar is already set on your app.')
    })

    it('# errors out on unmapped codon urls', async function () {
      Stubber.get(api, ['https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz'])

      const {error} = await runCommand(['buildpacks:add', 'https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz', '-a', 'example'])

      expect(error?.message).to.include('The buildpack https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz is already set on your app.')
    })

    it('# errors out when already exists urn', async function () {
      Stubber.get(api, [
        {
          name: 'heroku/ruby',
          url: 'urn:buildpack:heroku/ruby',
        },
      ])

      const buildpack = Fixture.buildpack({
        blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/ruby.tgz',
        name: 'ruby',
        namespace: 'heroku',
      })

      nock('https://buildpack-registry.heroku.com')
        .get('/buildpacks/heroku%2Fruby')
        .reply(200, buildpack)

      const {error} = await runCommand(['buildpacks:add', 'heroku/ruby', '-a', 'example'])

      expect(error?.message).to.include('The buildpack heroku/ruby is already set on your app.')
    })
  })

  describe('-i INDEX URL', function () {
    it('# with no buildpacks adds the buildpack URL with index', async function () {
      Stubber.get(api)
      Stubber.put(api, ['https://github.com/heroku/heroku-buildpack-ruby'])

      const {stderr, stdout} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with one existing buildpack inserts a buildpack URL at index', async function () {
      Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-java'])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-java',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-ruby
  2. https://github.com/heroku/heroku-buildpack-java
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# with two existing buildpacks successfully inserts a buildpack URL at index', async function () {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])

      const {stderr, stdout} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '2', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
  3. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# returns an error message when i is not an integer', async function () {
      const {error} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', 'notinteger', '-a', 'example'])

      expect(error?.message).to.include('Parsing --index \n\tExpected an integer but received: notinteger\nSee more help with --help')
    })

    it('# returns an error message when i < 0', async function () {
      const {error} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '-1', '-a', 'example'])

      expect(error?.message).to.include('Invalid index. Must be greater than 0.')
    })

    it('# returns an error message when i == 0', async function () {
      const {error} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '0', '-a', 'example'])

      expect(error?.message).to.include('Invalid index. Must be greater than 0.')
    })
  })
})
