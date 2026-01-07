import {Fixture} from '@heroku/buildpack-registry'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'

describe('buildpacks:info', function () {
  afterEach(() => nock.cleanAll())

  it('shows info about the buildpack', async () => {
    nock('https://buildpack-registry.heroku.com')
      .get('/buildpacks/heroku%2Fruby')
      .reply(200, Fixture.buildpack({
        name: 'ruby',
        source: {
          type: 'github',
          owner: 'heroku',
          repo: 'heroku-buildpack-ruby',
        },
      }))
      .get('/buildpacks/heroku%2Fruby/revisions')
      .reply(200, [Fixture.revision()])
      .get('/buildpacks/heroku%2Fruby/readme')
      .reply(200, Fixture.readme())

    const {stdout} = await runCommand(['buildpacks:info', 'heroku/ruby'])

    expect(stdout).to.contain('=== heroku/ruby')
    expect(stdout).to.contain('languages')
    expect(stdout).to.match(/source:\s+https:\/\/github\.com\/heroku\/heroku-buildpack-ruby/)
  })

  it("handles if the buildpack doesn't exist", async () => {
    nock('https://buildpack-registry.heroku.com')
      .get('/buildpacks/hone%2Ftest')
      .reply(404, {})

    const {error} = await runCommand(['buildpacks:info', 'hone/test'])

    expect(error?.message).to.include("Could not find the buildpack 'hone/test'")
  })

  it('handles case if there are errors from the API', async () => {
    nock('https://buildpack-registry.heroku.com')
      .get('/buildpacks/hone%2Ftest')
      .reply(500, 'some error')

    const {error} = await runCommand(['buildpacks:info', 'hone/test'])

    expect(error?.message).to.include('Problems finding buildpack info: some error')
  })
})
