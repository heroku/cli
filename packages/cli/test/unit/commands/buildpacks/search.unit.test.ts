import {Fixture} from '@heroku/buildpack-registry'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('buildpacks:search', function () {
  let registryApi: nock.Scope

  beforeEach(function () {
    registryApi = nock('https://buildpack-registry.heroku.com')
  })

  afterEach(function () {
    registryApi.done()
    nock.cleanAll()
  })

  it('searches using the namespace', async function () {
    registryApi
      .get('/buildpacks?in[namespace][]=heroku')
      .reply(200, [
        Fixture.buildpack({
          description: 'Official Heroku Buildpack for Ruby',
          name: 'ruby',
        }),
      ])

    const {stdout} = await runCommand(['buildpacks:search', '--namespace', 'heroku'])

    expect(stdout).to.contain('heroku/ruby')
    expect(stdout).to.contain('1 buildpack found')
  })

  it('searches only returns unique buildpacks', async function () {
    const rubyBuildpack = Fixture.buildpack({
      description: 'Official Heroku Buildpack for Ruby',
      name: 'ruby',
    })

    registryApi
      .get('/buildpacks?in[namespace][]=ruby')
      .reply(200, [])
      .get('/buildpacks?in[name][]=ruby')
      .reply(200, [rubyBuildpack])
      .get('/buildpacks?like[description]=ruby')
      .reply(200, [rubyBuildpack])

    const {stdout} = await runCommand(['buildpacks:search', 'ruby'])

    expect(stdout).to.contain('1 buildpack found')
  })
})
