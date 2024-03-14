import {expect, test} from '@oclif/test'
import * as nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub'
nock.disableNetConnect()

describe('buildpacks:set', () => {
  describe('URL', () => {
    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api)
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-a', 'example'])
      .it('# with no buildpacks sets the buildpack URL', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack set. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/foobar/foobar',
        ])
      })
      .command(['buildpacks:set', 'https://github.com/foobar/foobar', '-a', 'example'])
      .catch('The buildpack https://github.com/foobar/foobar is already set on your app.')
      .it('# errors out when already exists')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
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
      })
      .stdout()
      .stderr()
      .command(['buildpacks:set', 'https://github.com/bar/bar', '-a', 'example'])
      .it('# overwrites in the first when no i is passed', ctx => {
        expect(ctx.stdout).to.equal(
          `Buildpack set. Next release on example will use:
  1. https://github.com/bar/bar
  2. https://github.com/baz/baz
  3. https://github.com/biz/biz
Run git push heroku main to create a new release using these buildpacks.
`)
      })
  })

  describe('-i INDEX URL', () => {
    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api)
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])
      .it('# with no buildpacks sets the buildpack URL with index', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack set. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])
      .it('# with one existing buildpack successfully overwrites an existing buildpack URL at index', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack set. Next release on example will use https://github.com/heroku/heroku-buildpack-ruby.
Run git push heroku main to create a new release using this buildpack.
`)
      })
    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])
      .catch('The buildpack https://github.com/heroku/heroku-buildpack-ruby is already set on your app.')
      .it('# with one existing buildpack unsuccessfully fails if buildpack is already set')

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
        ])
        Stubber.put(api, [
          'https://github.com/heroku/heroku-buildpack-ruby',
          'https://github.com/heroku/heroku-buildpack-nodejs',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '1', '-a', 'example'])
      .it('# with two existing buildpacks successfully overwrites an existing buildpack URL at index', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack set. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-ruby
  2. https://github.com/heroku/heroku-buildpack-nodejs
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
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '3', '-a', 'example'])
      .it('# with two existing buildpacks successfully adds buildpack URL to the end of list', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack set. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
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
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-ruby', '-i', '99', '-a', 'example'])
      .it('# with two existing buildpacks successfully adds buildpack URL to the very end of list', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `Buildpack set. Next release on example will use:
  1. https://github.com/heroku/heroku-buildpack-java
  2. https://github.com/heroku/heroku-buildpack-nodejs
  3. https://github.com/heroku/heroku-buildpack-ruby
Run git push heroku main to create a new release using these buildpacks.
`)
      })

    test
      .nock('https://api.heroku.com', (api: nock.ReplyCallbackResult) => {
        Stubber.get(api, [
          'https://github.com/heroku/heroku-buildpack-java',
          'https://github.com/heroku/heroku-buildpack-nodejs',
        ])
      })
      .stdout()
      .stderr()
      .command(['buildpacks:set', 'https://github.com/heroku/heroku-buildpack-java', '-i', '2', '-a', 'example'])
      .catch('The buildpack https://github.com/heroku/heroku-buildpack-java is already set on your app.')
      .it('# with two existing buildpacks unsuccessfully fails if buildpack is already set')

    test
      .command(['buildpacks:set', 'https://github.com/bar/bar', '-i', 'notaninteger', '-a', 'example'])
      .catch('Parsing --index \n\tExpected an integer but received: notaninteger\nSee more help with --help')
      .it('# returns an error message when i is not an integer')

    test
      .command(['buildpacks:set', 'https://github.com/bar/bar', '-i', '-1', '-a', 'example'])
      .catch('Invalid index. Must be greater than 0.')
      .it('# returns an error message when i < 0')

    test
      .command(['buildpacks:set', '-a', 'example'])
      .catch(`Missing 1 required arg:
buildpack  namespace/name of the buildpack
See more help with --help`)
      .it('# handles a missing buildpack URL arg')
  })
})
