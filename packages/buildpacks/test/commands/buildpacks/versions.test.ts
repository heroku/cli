import Nock from '@fancy-test/nock'
import {expect, test as otest} from '@oclif/test'
import {Fixture} from 'buildpack-registry'
import * as nock from 'nock'
// tslint:disable-next-line:no-duplicate-imports
import {Scope} from 'nock'
nock.disableNetConnect()
const test = otest.register('nock', Nock)

describe('buildpacks:versions', () => {
  test
    .env({HEROKU_API_KEY: 'authtoken'})
    .nock('https://buildpack-registry.heroku.com', (api: Scope) => {
      api
        .get('/buildpacks/heroku%2Fruby/revisions')
        .reply(200, [
          Fixture.revision({
            release: 138,
          })
        ])
    })
    .stdout()
    .command(['buildpacks:versions', 'heroku/ruby'])
    .it('shows info about the buildpack', ctx => {
      expect(ctx.stdout).to.contain('138')
    })

  test
    .env({HEROKU_API_KEY: 'authtoken'})
    .nock('https://buildpack-registry.heroku.com', (api: Scope) => {
      api
        .get('/buildpacks/hone%2Ftest/revisions')
        .reply(404, '')
    })
    .command(['buildpacks:versions', 'hone/test'])
    .catch("Could not find 'hone/test'")
    .it('handles buildpack not existing')

  test
    .env({HEROKU_API_KEY: 'authtoken'})
    .nock('https://buildpack-registry.heroku.com', (api: Scope) => {
      api
        .get('/buildpacks/hone%2Ftest/revisions')
        .reply(500, 'some error')
    })
    .command(['buildpacks:versions', 'hone/test'])
    .catch('Problem fetching versions, 500: some error')
    .it('handles server error')
})
