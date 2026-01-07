import {Fixture} from '@heroku/buildpack-registry'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('buildpacks:search', function () {
  afterEach(() => nock.cleanAll())

  it('searches using the namespace', async () => {
    nock('https://buildpack-registry.heroku.com')
      .get('/buildpacks?in[namespace][]=heroku')
      .reply(200, [
        Fixture.buildpack({
          name: 'ruby',
          description: 'Official Heroku Buildpack for Ruby',
        }),
      ])

    const {stdout} = await runCommand(['buildpacks:search', '--namespace', 'heroku'])

    expect(stdout).to.contain('heroku/ruby')
    expect(stdout).to.contain('1 buildpack found')
  })

  it('searches only returns unique buildpacks', async () => {
    const rubyBuildpack = Fixture.buildpack({
      name: 'ruby',
      description: 'Official Heroku Buildpack for Ruby',
    })

    nock('https://buildpack-registry.heroku.com')
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
