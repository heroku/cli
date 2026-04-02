import {expect} from 'chai'
import nock from 'nock'

import AppsDiff from '../../../../src/commands/apps/diff.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('apps:diff', function () {
  const app1Name = 'myapp-one'
  const app2Name = 'myapp-two'
  const slugId1 = 'slug-id-1'
  const slugId2 = 'slug-id-2'
  const sameChecksum = 'SHA256:same-checksum-for-both-apps'
  const releasesWithSlug = (slugId: string) => [{slug: {id: slugId}, status: 'succeeded'}]
  const slugBody = (checksum: string) => ({id: 'slug-1', checksum})
  const appStack = (stackName: string) => ({name: 'myapp', stack: {name: stackName}, id: 'app-id'})
  const emptyBuildpacks: Array<{buildpack: {url: string}}> = []
  const emptyAddons: Array<{addon_service: {name: string}}> = []
  const emptyFeatures: Array<{name: string; enabled: boolean}> = []

  let api: nock.Scope

  function mockNoDiffs(app1: string, app2: string, slug1: string, slug2: string) {
    const releases1 = releasesWithSlug(slug1)
    const releases2 = releasesWithSlug(slug2)
    api
      .get(`/apps/${app1}/releases`)
      .matchHeader('range', /version/)
      .reply(200, releases1)
      .get(`/apps/${app1}/slugs/${slug1}`)
      .reply(200, slugBody(sameChecksum))
      .get(`/apps/${app2}/releases`)
      .matchHeader('range', /version/)
      .reply(200, releases2)
      .get(`/apps/${app2}/slugs/${slug2}`)
      .reply(200, slugBody(sameChecksum))
      .get(`/apps/${app1}/config-vars`)
      .reply(200, {})
      .get(`/apps/${app2}/config-vars`)
      .reply(200, {})
      .get(`/apps/${app1}`)
      .reply(200, appStack('heroku-22'))
      .get(`/apps/${app2}`)
      .reply(200, appStack('heroku-22'))
      .get(`/apps/${app1}/buildpack-installations`)
      .reply(200, emptyBuildpacks)
      .get(`/apps/${app2}/buildpack-installations`)
      .reply(200, emptyBuildpacks)
      .get(`/apps/${app1}/addons`)
      .reply(200, emptyAddons)
      .get(`/apps/${app2}/addons`)
      .reply(200, emptyAddons)
      .get(`/apps/${app1}/features`)
      .reply(200, emptyFeatures)
      .get(`/apps/${app2}/features`)
      .reply(200, emptyFeatures)
  }

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('prints table with no diff rows when both apps are identical', async function () {
    mockNoDiffs(app1Name, app2Name, slugId1, slugId2)

    const {stdout, error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('property')
    expect(stdout).to.include(app1Name)
    expect(stdout).to.include(app2Name)
    expect(stdout.trim()).to.not.include('slug (checksum)')
  })

  it('includes slug (checksum) row when checksums differ', async function () {
    const checksum1 = 'SHA256:aaaaaaaa'
    const checksum2 = 'SHA256:bbbbbbbb'
    api
      .get(`/apps/${app1Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId1))
      .get(`/apps/${app1Name}/slugs/${slugId1}`).reply(200, slugBody(checksum1))
      .get(`/apps/${app2Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId2))
      .get(`/apps/${app2Name}/slugs/${slugId2}`).reply(200, slugBody(checksum2))
      .get(`/apps/${app1Name}/config-vars`).reply(200, {})
      .get(`/apps/${app2Name}/config-vars`).reply(200, {})
      .get(`/apps/${app1Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app2Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app1Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app2Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app1Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app2Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app1Name}/features`).reply(200, emptyFeatures)
      .get(`/apps/${app2Name}/features`).reply(200, emptyFeatures)

    const {stdout, error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.include('SHA256:aaaaaaaa')
    expect(stdout).to.include('SHA256:bbbbbbbb')
  })

  it('includes config and stack diff rows when they differ', async function () {
    api
      .get(`/apps/${app1Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId1))
      .get(`/apps/${app1Name}/slugs/${slugId1}`).reply(200, slugBody(sameChecksum))
      .get(`/apps/${app2Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId2))
      .get(`/apps/${app2Name}/slugs/${slugId2}`).reply(200, slugBody(sameChecksum))
      .get(`/apps/${app1Name}/config-vars`).reply(200, {FOO: 'a', BAR: 'same'})
      .get(`/apps/${app2Name}/config-vars`).reply(200, {FOO: 'b', BAR: 'same'})
      .get(`/apps/${app1Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app2Name}`).reply(200, appStack('heroku-24'))
      .get(`/apps/${app1Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app2Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app1Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app2Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app1Name}/features`).reply(200, emptyFeatures)
      .get(`/apps/${app2Name}/features`).reply(200, emptyFeatures)

    const {stdout, error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('config (FOO)')
    expect(stdout).to.include('stack')
    expect(stdout).to.include('heroku-22')
    expect(stdout).to.include('heroku-24')
  })

  it('throws App not found when one app returns 404 on releases', async function () {
    api
      .get(`/apps/${app1Name}/releases`).matchHeader('range', /version/).reply(404, {id: 'not_found', message: 'Couldn\'t find that app.'})
      .get(`/apps/${app2Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId2))
      .get(`/apps/${app2Name}/slugs/${slugId2}`).optionally().reply(200, slugBody(sameChecksum))

    const {error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.not.be.undefined
    expect(error!.message).to.include('App not found')
    expect(error!.message).to.include(app1Name)
  })

  it('throws App not found when slug returns 404', async function () {
    api
      .get(`/apps/${app1Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId1))
      .get(`/apps/${app1Name}/slugs/${slugId1}`).reply(404, {id: 'not_found', message: 'Not found'})
      .get(`/apps/${app2Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId2))
      .get(`/apps/${app2Name}/slugs/${slugId2}`).reply(200, slugBody(sameChecksum))

    const {error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.not.be.undefined
    expect(error!.message).to.include('App not found')
    expect(error!.message).to.include(app1Name)
  })

  it('truncates long values to 56 chars with ellipsis', async function () {
    const longChecksum = 'SHA256:' + 'a'.repeat(60)
    api
      .get(`/apps/${app1Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId1))
      .get(`/apps/${app1Name}/slugs/${slugId1}`).reply(200, slugBody(longChecksum))
      .get(`/apps/${app2Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId2))
      .get(`/apps/${app2Name}/slugs/${slugId2}`).reply(200, slugBody(sameChecksum))
      .get(`/apps/${app1Name}/config-vars`).reply(200, {})
      .get(`/apps/${app2Name}/config-vars`).reply(200, {})
      .get(`/apps/${app1Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app2Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app1Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app2Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app1Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app2Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app1Name}/features`).reply(200, emptyFeatures)
      .get(`/apps/${app2Name}/features`).reply(200, emptyFeatures)

    const {stdout, error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('slug (checksum)')
    expect(stdout).to.match(/\.\.\./)
    expect(stdout).to.include('SHA256:')
  })

  it('shows add-on only on second app', async function () {
    const addons1 = emptyAddons
    const addons2 = [{addon_service: {name: 'heroku-postgresql'}}]
    api
      .get(`/apps/${app1Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId1))
      .get(`/apps/${app1Name}/slugs/${slugId1}`).reply(200, slugBody(sameChecksum))
      .get(`/apps/${app2Name}/releases`).matchHeader('range', /version/).reply(200, releasesWithSlug(slugId2))
      .get(`/apps/${app2Name}/slugs/${slugId2}`).reply(200, slugBody(sameChecksum))
      .get(`/apps/${app1Name}/config-vars`).reply(200, {})
      .get(`/apps/${app2Name}/config-vars`).reply(200, {})
      .get(`/apps/${app1Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app2Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app1Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app2Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app1Name}/addons`).reply(200, addons1)
      .get(`/apps/${app2Name}/addons`).reply(200, addons2)
      .get(`/apps/${app1Name}/features`).reply(200, emptyFeatures)
      .get(`/apps/${app2Name}/features`).reply(200, emptyFeatures)

    const {stdout, error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('add-on (heroku-postgresql)')
    expect(stdout).to.include('false')
    expect(stdout).to.include('true')
  })

  it('shows no slug row when both apps have no release slug', async function () {
    const releasesNoSlug = [{status: 'succeeded'}]
    api
      .get(`/apps/${app1Name}/releases`).matchHeader('range', /version/).reply(200, releasesNoSlug)
      .get(`/apps/${app2Name}/releases`).matchHeader('range', /version/).reply(200, releasesNoSlug)
      .get(`/apps/${app1Name}/config-vars`).reply(200, {})
      .get(`/apps/${app2Name}/config-vars`).reply(200, {})
      .get(`/apps/${app1Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app2Name}`).reply(200, appStack('heroku-22'))
      .get(`/apps/${app1Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app2Name}/buildpack-installations`).reply(200, emptyBuildpacks)
      .get(`/apps/${app1Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app2Name}/addons`).reply(200, emptyAddons)
      .get(`/apps/${app1Name}/features`).reply(200, emptyFeatures)
      .get(`/apps/${app2Name}/features`).reply(200, emptyFeatures)

    const {stdout, error} = await runCommand(AppsDiff, [app1Name, app2Name])

    expect(error).to.be.undefined
    expect(stdout).to.include('property')
    expect(stdout.trim()).to.not.include('slug (checksum)')
  })
})
