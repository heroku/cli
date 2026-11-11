import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import BuildpacksInfo from '../../../../src/commands/buildpacks/info.js'
import {Fixture} from '../../../helpers/buildpacks/fixture.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('buildpacks:info', function () {
  let registryApi: nock.Scope

  beforeEach(function () {
    registryApi = nock('https://buildpack-registry.heroku.com')
  })

  afterEach(function () {
    registryApi.done()
    nock.cleanAll()
  })

  it('errors on an invalid buildpack slug without calling the registry', async function () {
    const {error} = await runCommand(BuildpacksInfo, ['not-a-slug'])

    expect(error?.message).to.include("Could not find the buildpack 'not-a-slug'.")
    expect(error?.message).to.include('namespace/name')
  })

  it('shows info about the buildpack', async function () {
    registryApi
      .get('/buildpacks/heroku%2Fruby')
      .reply(200, Fixture.buildpack({
        name: 'ruby',
        source: {
          owner: 'heroku',
          repo: 'heroku-buildpack-ruby',
          type: 'github',
        },
      }))
      .get('/buildpacks/heroku%2Fruby/revisions')
      .reply(200, [Fixture.revision()])
      .get('/buildpacks/heroku%2Fruby/readme')
      .reply(200, Fixture.readme())

    const {stderr, stdout} = await runCommand(BuildpacksInfo, ['heroku/ruby'])

    expect(stdout).to.contain('=== heroku/ruby')
    expect(stdout).to.contain('languages')
    expect(stdout).to.match(/source:\s+https:\/\/github\.com\/heroku\/heroku-buildpack-ruby/)
    expect(stderr).to.equal('')
  })

  it('warns when the buildpack is archived', async function () {
    registryApi
      .get('/buildpacks/heroku%2Fruby')
      .reply(200, Fixture.buildpack({archived: true, name: 'ruby'}))
      .get('/buildpacks/heroku%2Fruby/revisions')
      .reply(200, [Fixture.revision()])
      .get('/buildpacks/heroku%2Fruby/readme')
      .reply(200, Fixture.readme())

    const {stderr, stdout} = await runCommand(BuildpacksInfo, ['heroku/ruby'])

    expect(unwrap(stderr)).to.equal('Warning: This buildpack has been archived.\n')
    expect(stdout).to.contain('=== heroku/ruby')
  })

  it("handles if the buildpack doesn't exist", async function () {
    registryApi
      .get('/buildpacks/hone%2Ftest')
      .reply(404, {})

    const {error} = await runCommand(BuildpacksInfo, ['hone/test'])

    expect(error?.message).to.include("Could not find the buildpack 'hone/test'")
  })

  it('handles case if there are errors from the API', async function () {
    registryApi
      .get('/buildpacks/hone%2Ftest')
      .reply(500, 'some error')

    const {error} = await runCommand(BuildpacksInfo, ['hone/test'])

    expect(error?.message).to.include('Problems finding buildpack info: some error')
  })

  it('outputs buildpack info as JSON when --json flag is set', async function () {
    registryApi
      .get('/buildpacks/heroku%2Fruby')
      .reply(200, Fixture.buildpack({
        name: 'ruby',
        source: {
          owner: 'heroku',
          repo: 'heroku-buildpack-ruby',
          type: 'github',
        },
      }))
      .get('/buildpacks/heroku%2Fruby/revisions')
      .reply(200, [Fixture.revision()])
      .get('/buildpacks/heroku%2Fruby/readme')
      .reply(200, Fixture.readme())

    const {stderr, stdout} = await runCommand(BuildpacksInfo, ['heroku/ruby', '--json'])

    const parsed = JSON.parse(stdout)
    expect(parsed).to.be.an('object')
    expect(parsed).to.have.property('description')
    expect(parsed).to.have.property('archived', false)
    expect(stderr).to.equal('')
  })

  it('does not warn when the buildpack is archived and --json flag is set', async function () {
    registryApi
      .get('/buildpacks/heroku%2Fruby')
      .reply(200, Fixture.buildpack({archived: true, name: 'ruby'}))
      .get('/buildpacks/heroku%2Fruby/revisions')
      .reply(200, [Fixture.revision()])
      .get('/buildpacks/heroku%2Fruby/readme')
      .reply(200, Fixture.readme())

    const {stderr, stdout} = await runCommand(BuildpacksInfo, ['heroku/ruby', '--json'])

    expect(JSON.parse(stdout)).to.have.property('archived', true)
    expect(stderr).to.equal('')
  })
})
