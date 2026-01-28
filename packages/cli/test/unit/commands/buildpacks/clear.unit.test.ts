import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

import {BuildpackInstallationsStub as Stubber} from '../../../helpers/buildpacks/buildpack-installations-stub.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('buildpacks:clear', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('# clears the buildpack URL', async function () {
    Stubber.put(api)
    api
      .get('/apps/example/config-vars')
      .reply(200, {})

    const {stdout} = await runCommand(['buildpacks:clear', '-a', 'example'])

    expect(stdout).to.equal('Buildpacks cleared. Next release on ⬢ example will detect buildpacks normally.\n')
  })

  it('# clears and warns about buildpack URL config var', async function () {
    Stubber.put(api)
    api
      .get('/apps/example/config-vars')
      .reply(200, {BUILDPACK_URL: 'https://github.com/foo/foo'})

    const {stderr, stdout} = await runCommand(['buildpacks:clear', '-a', 'example'])

    expect(stdout).to.equal('Buildpacks cleared.\n')
    expect(unwrap(stderr)).to.equal('Warning: The BUILDPACK_URL config var is still set and will be used for the next release\n')
  })

  it('# clears and warns about language pack URL config var', async function () {
    Stubber.put(api)
    api
      .get('/apps/example/config-vars')
      .reply(200, {LANGUAGE_PACK_URL: 'https://github.com/foo/foo'})

    const {stderr, stdout} = await runCommand(['buildpacks:clear', '-a', 'example'])

    expect(stdout).to.equal('Buildpacks cleared.\n')
    expect(unwrap(stderr)).to.equal('Warning: The LANGUAGE_PACK_URL config var is still set and will be used for the next release\n')
  })
})
