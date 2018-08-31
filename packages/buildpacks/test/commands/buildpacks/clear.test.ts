import Nock from '@fancy-test/nock'
import {expect, test as otest} from '@oclif/test'
import * as nock from 'nock'
import {unwrap} from '../../unwrap'
// tslint:disable-next-line:no-duplicate-imports
import {Scope} from 'nock'
nock.disableNetConnect()
const test = otest.register('nock', Nock)

import {BuildpackInstallationsStub as Stubber} from '../../helpers/buildpack-installations-stub'

describe.only('buildpacks:clear', () => {
  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.put(api)
      api
        .get('/apps/example/config-vars')
        .reply(200, {})
    })
    .stdout()
    .command(['buildpacks:clear', '-a', 'example'])
    .it('# clears the buildpack URL', ctx => {
      nock('https://api.heroku.com')

      expect(ctx.stdout).to.equal('Buildpacks cleared. Next release on example will detect buildpacks normally.\n')
    })

  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.put(api)
      api
        .get('/apps/example/config-vars')
        .reply(200, {BUILDPACK_URL: 'https://github.com/foo/foo'})
    })
    .stdout()
    .stderr()
    .command(['buildpacks:clear', '-a', 'example'])
    .it('# clears and warns about buildpack URL config var', ctx => {
      expect(ctx.stdout).to.equal('Buildpacks cleared.\n')
      expect(unwrap(ctx.stderr)).to.equal('Warning: The BUILDPACK_URL config var is still set and will be used for the next release\n')
    })

  test
    .nock('https://api.heroku.com', (api: Scope) => {
      Stubber.put(api)
      api
      .get('/apps/example/config-vars')
        .reply(200, {LANGUAGE_PACK_URL: 'https://github.com/foo/foo'})
    })
    .stdout()
    .stderr()
    .command(['buildpacks:clear', '-a', 'example'])
    .it('# clears and warns about language pack URL config var', ctx => {
      expect(ctx.stdout).to.equal('Buildpacks cleared.\n')
      expect(unwrap(ctx.stderr)).to.equal('Warning: The LANGUAGE_PACK_URL config var is still set and will be used for the next release\n')
    })
})
