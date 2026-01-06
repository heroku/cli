import {Fixture} from '@heroku/buildpack-registry'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub.js'

describe('buildpacks:add', function () {
  afterEach(() => nock.cleanAll())

  describe('URL', function () {
    it('# maps buildpack names', async () => {
      const registry = new Map()
      registry.set('https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz', {url: 'urn:buildpack:hone/test', name: 'hone/test'})

      const api = nock('https://api.heroku.com')
      Stubber.get(api)
      Stubber.put(api, ['https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz'], registry)

      const buildpack = Fixture.buildpack({
        namespace: 'hone',
        name: 'test',
        blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz',
      })

      nock('https://buildpack-registry.heroku.com')
        .get('/buildpacks/hone%2Ftest')
        .times(2)
        .reply(200, buildpack)

      const {stdout, stderr} = await runCommand(['buildpacks:add', 'hone/test', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use hone/test.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with no buildpacks adds the buildpack URL', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api)
      Stubber.put(api, ['https://github.com/heroku/heroku-buildpack-ruby'])

      const {stdout, stderr} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with one existing buildpack adds a buildpack URL to the end of the list', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-java'])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stdout, stderr} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# with two existing buildpacks successfully adds a buildpack URL to the end of the list', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])

      const {stdout, stderr} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# errors out when already exists', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api, ['https://github.com/foobar/foobar'])

      const {error} = await runCommand(['buildpacks:add', 'https://github.com/foobar/foobar', '-a', 'example'])

      expect(error?.message).to.include('The buildpack https://github.com/foobar/foobar is already set on your app.')
    })

    it('# errors out on unmapped codon urls', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api, ['https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz'])

      const {error} = await runCommand(['buildpacks:add', 'https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz', '-a', 'example'])

      expect(error?.message).to.include('The buildpack https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz is already set on your app.')
    })

    it('# errors out when already exists urn', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api, [
        {
          url: 'urn:buildpack:heroku/ruby',
          name: 'heroku/ruby',
        },
      ])

      const buildpack = Fixture.buildpack({
        namespace: 'heroku',
        name: 'ruby',
        blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/ruby.tgz',
      })

      nock('https://buildpack-registry.heroku.com')
        .get('/buildpacks/heroku%2Fruby')
        .reply(200, buildpack)

      const {error} = await runCommand(['buildpacks:add', 'heroku/ruby', '-a', 'example'])

      expect(error?.message).to.include('The buildpack heroku/ruby is already set on your app.')
    })
  })

  describe('-i INDEX URL', function () {
    it('# with no buildpacks adds the buildpack URL with index', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api)
      Stubber.put(api, ['https://github.com/heroku/heroku-buildpack-ruby'])

      const {stdout, stderr} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
    })

    it('# with one existing buildpack inserts a buildpack URL at index', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-java'])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-java',
      ])

      const {stdout, stderr} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-ruby
  2. https://github.com/heroku/heroku-buildpack-java
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# with two existing buildpacks successfully inserts a buildpack URL at index', async () => {
      const api = nock('https://api.heroku.com')
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])
      Stubber.put(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
        'https://github.com/heroku/heroku-buildpack-nodejs',
      ])

      const {stdout, stderr} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '2', '-a', 'example'])

      expect(stderr).to.equal('')
      expect(stdout).to.equal(
        `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
  3. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku main to create a new release using these buildpacks.
`)
    })

    it('# returns an error message when i is not an integer', async () => {
      const {error} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', 'notinteger', '-a', 'example'])

      expect(error?.message).to.include('Parsing --index \n\tExpected an integer but received: notinteger\nSee more help with --help')
    })

    it('# returns an error message when i < 0', async () => {
      const {error} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '-1', '-a', 'example'])

      expect(error?.message).to.include('Invalid index. Must be greater than 0.')
    })

    it('# returns an error message when i == 0', async () => {
      const {error} = await runCommand(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '0', '-a', 'example'])

      expect(error?.message).to.include('Invalid index. Must be greater than 0.')
    })
  })
})
