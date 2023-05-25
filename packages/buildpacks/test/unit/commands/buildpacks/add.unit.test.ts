import {Fixture} from '@heroku/buildpack-registry'
import {expect, test} from '@oclif/test'
import * as nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpack-installations-stub'
nock.disableNetConnect()

describe('buildpacks:add', () => {
  describe('URL', () => {
    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        const registry = new Map()
        registry.set('https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz', {url: 'urn:buildpack:hone/test', name: 'hone/test'})

        Stubber.get(api)
        Stubber.put(api, ['https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz'], registry)
      })
      .nock('https://buildpack-registry.heroku.com', (api: nock.ReplyCallbackResult) => {
        const buildpack = Fixture.buildpack({
          namespace: 'hone',
          name: 'test',
          blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/hone/test.tgz',
        })

        api
          .get('/buildpacks/hone%2Ftest')
          .times(2)
          .reply(200, buildpack)
      })
      .stdout()
      .stderr()
      .command(['buildpacks:add', 'hone/test', '-a', 'example'])
      .it('# maps buildpack names', ctx => {
      // TODO: On the upgrade to Node 12 this produced an error related to
      // an older version of nock used by fancy-nock
      // ctx.stderr contained: 'OutgoingMessage.prototype._headers is deprecated'
        expect(ctx.stderr).to.equal('')

        expect(ctx.stdout).to.equal(
          `Buildpack added. Next release on example will use hone/test.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api)
        Stubber.put(api, ['https://github.com/heroku/heroku-buildpack-ruby'])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])
      .it('# with no buildpacks adds the buildpack URL', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-java'])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])
      .it('# with one existing buildpack adds a buildpack URL to the end of the list', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])
      .it('# with two existing buildpacks successfully adds a buildpack URL to the end of the list', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, ['https://github.com/foobar/foobar'])
      })
      .stderr()
      .command(['buildpacks:add', 'https://github.com/foobar/foobar', '-a', 'example'])
      .catch('The buildpack https://github.com/foobar/foobar is already set on your app.')
      .it('# errors out when already exists')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, ['https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz'])
      })
      .stderr()
      .command(['buildpacks:add', 'https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz', '-a', 'example'])
      .catch('The buildpack https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/jvm-common.tgz is already set on your app.')
      .it('# errors out on unmapped codon urls')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          {
            url: 'urn:buildpack:heroku/ruby',
            name: 'heroku/ruby',
          },
        ])
      })
      .nock('https://buildpack-registry.heroku.com', (api: nock.ReplyCallbackResult) => {
        const buildpack = Fixture.buildpack({
          namespace: 'heroku',
          name: 'ruby',
          blob_url: 'https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku/ruby.tgz',
        })

        api
          .get('/buildpacks/heroku%2Fruby')
          .reply(200, buildpack)
      })
      .command(['buildpacks:add', 'heroku/ruby', '-a', 'example'])
      .catch('The buildpack heroku/ruby is already set on your app.')
      .it('# errors out when already exists urn')
  })

  describe('-i INDEX URL', () => {
    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api)
        Stubber.put(api, ['https://github.com/heroku/heroku-buildpack-ruby'])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])
      .it('# with no buildpacks adds the buildpack URL with index', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack added. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-java'])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
          'https://github.com/heroku/heroku-buildpack-java',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])
      .it('# with one existing buildpack inserts a buildpack URL at index', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-ruby
  2. https://github.com/heroku/heroku-buildpack-java
Run git push heroku main to create a new release using these buildpacks.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-ruby',
          'https://github.com/heroku/heroku-buildpack-nodejs',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '2', '-a', 'example'])
      .it('# with two existing buildpacks successfully inserts a buildpack URL at index', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack added. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
  3. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku main to create a new release using these buildpacks.
`)
      })

    test
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', 'notinteger', '-a', 'example'])
      .catch('Parsing --index \n\tExpected an integer but received: notinteger\nSee more help with --help')
      .it('# returns an error message when i is not an integer')

    test
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '-1', '-a', 'example'])
      .catch('Invalid index. Must be greater than 0.')
      .it('# returns an error message when i < 0')

    test
      .command(['buildpacks:add', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '0', '-a', 'example'])
      .catch('Invalid index. Must be greater than 0.')
      .it('# returns an error message when i == 0')
  })
})
