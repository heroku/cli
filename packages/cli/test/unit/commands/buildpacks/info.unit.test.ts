import {Fixture} from '@heroku/buildpack-registry'
import {expect, test} from '@oclif/test'
import * as nock from 'nock'
nock.disableNetConnect()

describe('buildpacks:info', () => {
  test
    .nock('https://buildpack-registry.heroku.com', (api: nock.Scope) => {
      api
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
    })
    .stdout()
    .command(['buildpacks:info', 'heroku/ruby'])
    .it('shows info about the buildpack', ctx => {
      expect(ctx.stdout).to.contain('=== heroku/ruby')
      expect(ctx.stdout).to.contain('languages')
      expect(ctx.stdout).to.match(/source:\s+https:\/\/github\.com\/heroku\/heroku-buildpack-ruby/)
    })

  test
    .nock('https://buildpack-registry.heroku.com', (api: nock.Scope) => {
      api
        .get('/buildpacks/hone%2Ftest')
        .reply(404, {})
    })
    .command(['buildpacks:info', 'hone/test'])
    .catch("Could not find the buildpack 'hone/test'")
    .it("handles if the buildpack doesn't exist")

  test
    .nock('https://buildpack-registry.heroku.com', (api: nock.Scope) => {
      api
        .get('/buildpacks/hone%2Ftest')
        .reply(500, 'some error')
    })
    .command(['buildpacks:info', 'hone/test'])
    .catch('Problems finding buildpack info: some error')
    .it('handles case if there are errors from the API')
})
