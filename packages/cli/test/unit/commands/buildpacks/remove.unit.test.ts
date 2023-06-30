import {Fixture} from '@heroku/buildpack-registry'
import {expect, test} from '@oclif/test'
import * as nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub'
import {unwrap} from '../../../helpers/buildpacks/unwrap'
nock.disableNetConnect()

describe('buildpacks:remove', () => {
  describe('-i INDEX', () => {
    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-ruby'])
        Stubber.put(api)
        api
          .get('/apps/example/config-vars')
          .reply(200, {})
      })
      .stdout()
      .stderr()
      .command(['buildpacks:remove', '-i', '1', '-a', 'example'])
      .it('# with one buildpack successfully removes index', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will detect buildpacks normally.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api)
        api
          .get('/apps/example/config-vars')
          .reply(200, {LANGUAGE_PACK_URL: 'https://github.com/foo/foo'})
      })
      .stdout()
      .stderr()
      .command(['buildpacks:remove', '-i', '1', '-a', 'example'])
      .it('# with one buildpack successfully removes index with langauge warn', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed.
`)
        expect(unwrap(ctx.stderr)).to.equal('Warning: The LANGUAGE_PACK_URL config var is still set and will be used for the next release\n')
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api)
        api
          .get('/apps/example/config-vars')
          .reply(200, {BUILDPACK_URL: 'https://github.com/foo/foo'})
      })
      .stdout()
      .stderr()
      .command(['buildpacks:remove', '-i', '1', '-a', 'example'])
      .it('# with one buildpack successfully removes index with buildpack warn', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed.
`)
        expect(unwrap(ctx.stderr)).to.equal('Warning: The BUILDPACK_URL config var is still set and will be used for the next release\n')
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-java',
        ])
      })
      .stdout()
      .command(['buildpacks:remove', '-i', '2', '-a', 'example'])
      .it('# with two buildpacks successfully removes index - java', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-java.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .command(['buildpacks:remove', '-i', '1', '-a', 'example'])
      .it('# with two buildpacks successfully removes index - ruby', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .command(['buildpacks:remove', '-i', '2', '-a', 'example'])
      .it('# with three buildpacks successfully removes index', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
      })

    test
      .command(['buildpacks:remove', '-i', 'notaninteger', '-a', 'example'])
      .catch('Parsing --index \n\tExpected an integer but received: notaninteger\nSee more help with --help')
      .it('# returns an error message when i is not an integer')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api)
      })
      .command(['buildpacks:remove', '-i', '1', '-a', 'example'])
      .catch('No buildpacks were found. Next release on example will detect buildpack normally.')
      .it('# with no buildpacks reports an error removing index')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/foo/foo',
        ])
      })
      .command(['buildpacks:remove', '-i', '2', '-a', 'example'])
      .catch('Invalid index. Only valid value is 1.')
      .it('# returns an error when the index > 1 and the size is one')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/foo/foo',
          'https://github.com/bar/bar',
        ])
      })
      .command(['buildpacks:remove', '-i', '3', '-a', 'example'])
      .catch('Invalid index. Please choose a value between 1 and 2')
      .it('# returns an error when the index > size and the size > one')
  })

  describe('URL', () => {
    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api)
        api
          .get('/apps/example/config-vars')
          .reply(200, {})
      })
      .stdout()
      .command(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])
      .it('# with one buildpack successfully removes url', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will detect buildpacks normally.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-java',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])
      .it('# with two buildpacks successfully removes url', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will use https://github.com/heroku/heroku-buildpack-java.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          {url: 'urn:buildpack:heroku/ruby', name: 'heroku/ruby'},
        ])
        Stubber.put(api)
        api
          .get('/apps/example/config-vars')
          .reply(200, {})
      })
      .nock('https://buildpack-registry.heroku.com', (api: nock.ReplyCallbackResult) => {
        const buildpack = Fixture.buildpack({
          name: 'ruby',
        })
        api
          .get('/buildpacks/heroku%2Fruby')
          .reply(200, buildpack)
      })
      .stdout()
      .stderr()
      .command(['buildpacks:remove', 'heroku/ruby', '-a', 'example'])
      .it('# remove by name should work', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will detect buildpacks normally.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api)
      })
      .command(['buildpacks:remove', 'https://github.com/bar/bar', '-a', 'example'])
      .catch('No buildpacks were found. Next release on example will detect buildpack normally.')
      .it('# with no buildpacks reports an error removing buildpack_url')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/foo/foo',
        ])
      })
      .command(['buildpacks:remove', 'https://github.com/bar/bar', '-a', 'example'])
      .catch('Buildpack not found. Nothing was removed.')
      .it('# returns an error when the url is not found')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
        ])
      })
      .stdout()
      .command(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])
      .it('# with three buildpacks successfully removes url', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack removed. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
Run git push heroku main to create a new release using these buildpacks.
`)
      })
  })

  describe('-i INDEX URL', () => {
    test
      .command(['buildpacks:remove', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])
      .catch('Please choose either index or Buildpack, but not both.')
      .it('# returns an error message when i and url are specified')

    test
      .command(['buildpacks:remove', '-a', 'example'])
      .catch('Usage: heroku buildpacks:remove [BUILDPACK_URL]. Must specify a buildpack to remove, either by index or URL.')
      .it('# returns an error message neither i or url are specified')
  })
})
