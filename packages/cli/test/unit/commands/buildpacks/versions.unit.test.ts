import {Fixture} from '@heroku/buildpack-registry'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('buildpacks:versions', function () {
  let originalApiKey: string | undefined
  let registryApi: nock.Scope

  beforeEach(function () {
    registryApi = nock('https://buildpack-registry.heroku.com')
    originalApiKey = process.env.HEROKU_API_KEY
    process.env.HEROKU_API_KEY = 'authtoken'
  })

  afterEach(function () {
    registryApi.done()
    nock.cleanAll()
    if (originalApiKey) {
      process.env.HEROKU_API_KEY = originalApiKey
    } else {
      delete process.env.HEROKU_API_KEY
    }
  })

  it('shows info about the buildpack', async function () {
    registryApi
      .get('/buildpacks/heroku%2Fruby/revisions')
      .reply(200, [
        Fixture.revision({
          release: 138,
        }),
      ])

    const {stdout} = await runCommand(['buildpacks:versions', 'heroku/ruby'])

    expect(stdout).to.contain('138')
  })

  it('handles buildpack not existing', async function () {
    registryApi
      .get('/buildpacks/hone%2Ftest/revisions')
      .reply(404, '')

    const {error} = await runCommand(['buildpacks:versions', 'hone/test'])

    expect(error?.message).to.include("Could not find 'hone/test'")
  })

  it('handles server error', async function () {
    registryApi
      .get('/buildpacks/hone%2Ftest/revisions')
      .reply(500, 'some error')

    const {error} = await runCommand(['buildpacks:versions', 'hone/test'])

    expect(error?.message).to.include('Problem fetching versions, 500: some error')
  })
})
