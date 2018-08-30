import Nock from '@fancy-test/nock'
import {expect, test as otest} from '@oclif/test'
import * as nock from 'nock'
// tslint:disable-next-line:no-duplicate-imports
import {Scope} from 'nock'
nock.disableNetConnect()
const test = otest.register('nock', Nock)

import {BuildpackInstallationsStub as Stubber} from '../../helpers/buildpack-installations-stub'

describe('buildpacks', () => {
  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.get(api, ['https://github.com/heroku/heroku-buildpack-ruby'])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', 'example'])
    .it('# displays the buildpack URL', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== example Buildpack URL
https://github.com/heroku/heroku-buildpack-ruby
`)
    })

  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.get(api, [{url: 'urn:buildpack:heroku/ruby', name: 'heroku/ruby'}])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', 'example'])
    .it('# maps buildpack urns to names', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== example Buildpack URL
heroku/ruby
`)
    })

  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.get(api, ['https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/ruby.tgz'])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', 'example'])
    .it('# does not map buildpack s3 to names', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== example Buildpack URL
https://codon-buildpacks.s3.amazonaws.com/buildpacks/heroku/ruby.tgz
`)
    })

  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.get(api)
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', 'example'])
    .it('# with no buildpack URL set does not display a buildpack URL', ctx => {
        expect(ctx.stderr).to.equal('')
        expect(ctx.stdout).to.equal(
          `example has no Buildpack URL set.
`)
    })

  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.get(api, [
        'https://github.com/heroku/heroku-buildpack-java',
        'https://github.com/heroku/heroku-buildpack-ruby',
      ])
    })
    .stdout()
    .stderr()
    .command(['buildpacks', '-a', 'example'])
    .it('# with two buildpack URLs set displays the buildpack URL', ctx => {
      expect(ctx.stderr).to.equal('')
      expect(ctx.stdout).to.equal(
        `=== example Buildpack URLs
1. https://github.com/heroku/heroku-buildpack-java
2. https://github.com/heroku/heroku-buildpack-ruby
`)
    })
})
