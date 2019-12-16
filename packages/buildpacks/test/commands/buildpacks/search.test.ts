import Nock from '@fancy-test/nock'
import {Fixture} from '@heroku/buildpack-registry'
import {expect, test as otest} from '@oclif/test'
import * as nock from 'nock'
// tslint:disable-next-line:no-duplicate-imports
import {Scope} from 'nock'
nock.disableNetConnect()
const test = otest.register('nock', Nock)

describe('buildpacks:search', () => {
  test
  .nock('https://buildpack-registry.heroku.com', (api: Scope) => {
    api
    .get('/buildpacks?in[namespace][]=heroku')
    .reply(200, [
      Fixture.buildpack({
        name: 'ruby',
        description: 'Official Heroku Buildpack for Ruby',
      }),
    ])
  })
  .stdout()
  .command(['buildpacks:search', '--namespace', 'heroku'])
  .it('searches using the namespace', ctx => {
    expect(ctx.stdout).to.contain('heroku/ruby')
    expect(ctx.stdout).to.contain('1 buildpack found')
  })

  test
  .nock('https://buildpack-registry.heroku.com', (api: Scope) => {
    const rubyBuildpack = Fixture.buildpack({
      name: 'ruby',
      description: 'Official Heroku Buildpack for Ruby',
    })

    api
    .get('/buildpacks?in[namespace][]=ruby')
    .reply(200, [])
    .get('/buildpacks?in[name][]=ruby')
    .reply(200, [rubyBuildpack])
    .get('/buildpacks?like[description]=ruby')
    .reply(200, [rubyBuildpack])
  })
  .stdout()
  .command(['buildpacks:search', 'ruby'])
  .it('searches only returns unique buildpacks', ctx => {
    expect(ctx.stdout).to.contain('1 buildpack found')
  })
})
