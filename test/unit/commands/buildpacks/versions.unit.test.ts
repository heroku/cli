import {APIClient} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {restore, stub} from 'sinon'

import BuildpacksVersions from '../../../../src/commands/buildpacks/versions.js'
import {Fixture} from '../../../helpers/buildpacks/fixture.js'

describe('buildpacks:versions', function () {
  let registryApi: nock.Scope

  beforeEach(function () {
    registryApi = nock('https://buildpack-registry.heroku.com')
    stub(APIClient.prototype, 'auth').get(() => 'authtoken')
  })

  afterEach(function () {
    registryApi.done()
    nock.cleanAll()
    restore()
  })

  it('errors on an invalid buildpack slug without calling the registry', async function () {
    const {error} = await runCommand(BuildpacksVersions, ['not-a-slug'])

    expect(error?.message).to.include("Could not find 'not-a-slug'.")
    expect(error?.message).to.include('namespace/name')
  })

  it('shows info about the buildpack', async function () {
    registryApi
      .get('/buildpacks/heroku%2Fruby/revisions')
      .reply(200, [
        Fixture.revision({
          release: 138,
        }),
      ])

    const {stdout} = await runCommand(BuildpacksVersions, ['heroku/ruby'])

    expect(stdout).to.contain('138')
  })

  it('handles buildpack not existing', async function () {
    registryApi
      .get('/buildpacks/hone%2Ftest/revisions')
      .reply(404, '')

    const {error} = await runCommand(BuildpacksVersions, ['hone/test'])

    expect(error?.message).to.include("Could not find 'hone/test'")
  })

  it('handles server error', async function () {
    registryApi
      .get('/buildpacks/hone%2Ftest/revisions')
      .reply(500, 'some error')

    const {error} = await runCommand(BuildpacksVersions, ['hone/test'])

    expect(error?.message).to.include('Problem fetching versions, 500: some error')
  })
})
