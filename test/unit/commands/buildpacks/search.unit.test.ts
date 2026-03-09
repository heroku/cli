import {Fixture} from '@heroku/buildpack-registry'
import {expect} from 'chai'
import nock from 'nock'

import BuildpacksSearch from '../../../../src/commands/buildpacks/search.js'
import {runCommand} from '../../../helpers/run-command.js'

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

    const {stdout} = await runCommand(BuildpacksSearch, ['--namespace', 'heroku'])

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

    const {stdout} = await runCommand(BuildpacksSearch, ['ruby'])

    expect(stdout).to.contain('1 buildpack found')
  })
})
